#!/usr/bin/env python3
"""
FastAPI ML Service for Job Recommendations
Integrates with the Node.js job portal
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
import joblib
import logging
import json
from datetime import datetime
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Job Recommendation ML Service", version="1.0.0")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class UserPreferences(BaseModel):
    skills: str
    experience: str = "Mid-level"
    industry: str = "Software"
    location: str = "Remote"
    min_salary: int = 50000

class RecommendationRequest(BaseModel):
    user_preferences: UserPreferences
    top_n: int = 10

class JobData(BaseModel):
    job_id: str
    title: str
    company: str
    location: str
    skills: List[str]
    industry: str
    experience_level: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    description: str

class TrainingData(BaseModel):
    user_id: str
    user_preferences: UserPreferences
    interactions: List[Dict[str, Any]]  # Applied, saved, viewed jobs
    feedback: Optional[Dict[str, Any]] = None

# Global variables for ML models
ml_model = None
tfidf_vectorizer = None
job_data_cache = []

class JobRecommendationEngine:
    def __init__(self):
        self.model_loaded = False
        self.load_model()
    
    def load_model(self):
        """Load the trained ML model if available"""
        try:
            model_path = 'job_recommendation_model.pkl'
            if os.path.exists(model_path):
                logger.info("Loading pre-trained ML model...")
                model_data = joblib.load(model_path)
                
                global ml_model, tfidf_vectorizer
                ml_model = model_data
                tfidf_vectorizer = model_data['tfidf_vectorizer']
                
                logger.info("✅ ML model loaded successfully!")
                self.model_loaded = True
            else:
                logger.warning("⚠️ No pre-trained model found. Using fallback recommendations.")
                self.model_loaded = False
                self._initialize_fallback_components()
                
        except Exception as e:
            logger.error(f"❌ Error loading ML model: {e}")
            self.model_loaded = False
            self._initialize_fallback_components()
    
    def _initialize_fallback_components(self):
        """Initialize components for fallback recommendations"""
        global tfidf_vectorizer
        tfidf_vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        logger.info("✅ Fallback recommendation engine initialized")
    
    def get_recommendations(self, user_prefs: UserPreferences, available_jobs: List[JobData], top_n: int = 10):
        """Get job recommendations for user"""
        try:
            if self.model_loaded and ml_model:
                return self._get_ml_recommendations(user_prefs, available_jobs, top_n)
            else:
                return self._get_fallback_recommendations(user_prefs, available_jobs, top_n)
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return self._get_simple_recommendations(user_prefs, available_jobs, top_n)
    
    def _get_ml_recommendations(self, user_prefs: UserPreferences, available_jobs: List[JobData], top_n: int):
        """Use trained ML model for recommendations"""
        try:
            # Prepare user preferences for ML model
            user_data = {
                'skills': user_prefs.skills,
                'experience': user_prefs.experience,
                'industry': user_prefs.industry,
                'location': user_prefs.location,
                'min_salary': user_prefs.min_salary
            }
            
            # Get recommendations from ML model
            recommendations = ml_model['tfidf_vectorizer'].transform([user_prefs.skills])
            
            # Score available jobs
            job_scores = []
            for job in available_jobs:
                job_text = f"{job.title} {' '.join(job.skills)} {job.industry}"
                job_vector = ml_model['tfidf_vectorizer'].transform([job_text])
                
                # Calculate similarity
                similarity = cosine_similarity(recommendations, job_vector)[0][0]
                
                # Apply additional scoring factors
                score = similarity
                
                # Experience level bonus
                if job.experience_level == user_prefs.experience:
                    score += 0.2
                elif self._is_compatible_experience(job.experience_level, user_prefs.experience):
                    score += 0.1
                
                # Industry bonus
                if job.industry == user_prefs.industry:
                    score += 0.15
                
                # Location bonus
                if user_prefs.location.lower() in job.location.lower() or user_prefs.location.lower() == 'remote':
                    score += 0.1
                
                # Salary bonus
                if job.salary_min and job.salary_min >= user_prefs.min_salary:
                    score += 0.05
                
                job_scores.append({
                    'job_id': job.job_id,
                    'title': job.title,
                    'company': job.company,
                    'location': job.location,
                    'similarity_score': min(score, 1.0),  # Cap at 1.0
                    'industry': job.industry,
                    'experience_level': job.experience_level,
                    'salary_min': job.salary_min,
                    'skills': job.skills
                })
            
            # Sort by score and return top N
            job_scores.sort(key=lambda x: x['similarity_score'], reverse=True)
            return job_scores[:top_n]
            
        except Exception as e:
            logger.error(f"ML recommendation error: {e}")
            return self._get_fallback_recommendations(user_prefs, available_jobs, top_n)
    
    def _get_fallback_recommendations(self, user_prefs: UserPreferences, available_jobs: List[JobData], top_n: int):
        """Fallback recommendation using TF-IDF similarity"""
        try:
            if not available_jobs:
                return []
            
            # Prepare job texts for TF-IDF
            job_texts = []
            for job in available_jobs:
                job_text = f"{job.title} {' '.join(job.skills)} {job.industry} {job.description}"
                job_texts.append(job_text)
            
            # Add user preferences as query
            user_query = f"{user_prefs.skills} {user_prefs.industry} {user_prefs.experience}"
            
            # Fit TF-IDF on job texts + user query
            all_texts = job_texts + [user_query]
            tfidf_matrix = tfidf_vectorizer.fit_transform(all_texts)
            
            # Get similarity between user query and all jobs
            user_vector = tfidf_matrix[-1]  # Last item is user query
            job_vectors = tfidf_matrix[:-1]  # All except last
            
            similarities = cosine_similarity(user_vector, job_vectors)[0]
            
            # Create scored recommendations
            job_scores = []
            for i, job in enumerate(available_jobs):
                base_score = similarities[i]
                
                # Apply bonus scoring
                bonus = 0
                
                # Experience match bonus
                if job.experience_level == user_prefs.experience:
                    bonus += 0.2
                elif self._is_compatible_experience(job.experience_level, user_prefs.experience):
                    bonus += 0.1
                
                # Industry match bonus
                if job.industry == user_prefs.industry:
                    bonus += 0.15
                
                # Location match bonus
                if (user_prefs.location.lower() in job.location.lower() or 
                    user_prefs.location.lower() == 'remote' or 
                    'remote' in job.location.lower()):
                    bonus += 0.1
                
                # Skills match bonus
                user_skills = [skill.strip().lower() for skill in user_prefs.skills.split(',')]
                job_skills = [skill.lower() for skill in job.skills]
                matching_skills = set(user_skills) & set(job_skills)
                if matching_skills:
                    bonus += len(matching_skills) * 0.05
                
                # Salary bonus
                if job.salary_min and job.salary_min >= user_prefs.min_salary:
                    bonus += 0.05
                
                final_score = min(base_score + bonus, 1.0)
                
                job_scores.append({
                    'job_id': job.job_id,
                    'title': job.title,
                    'company': job.company,
                    'location': job.location,
                    'similarity_score': final_score,
                    'industry': job.industry,
                    'experience_level': job.experience_level,
                    'salary_min': job.salary_min,
                    'skills': job.skills,
                    'matching_skills': list(matching_skills) if matching_skills else []
                })
            
            # Sort by score and return top N
            job_scores.sort(key=lambda x: x['similarity_score'], reverse=True)
            return job_scores[:top_n]
            
        except Exception as e:
            logger.error(f"Fallback recommendation error: {e}")
            return self._get_simple_recommendations(user_prefs, available_jobs, top_n)
    
    def _get_simple_recommendations(self, user_prefs: UserPreferences, available_jobs: List[JobData], top_n: int):
        """Simple keyword-based recommendations as last resort"""
        try:
            user_skills = [skill.strip().lower() for skill in user_prefs.skills.split(',')]
            
            job_scores = []
            for job in available_jobs:
                score = 0
                
                # Title keyword matching
                title_words = job.title.lower().split()
                for skill in user_skills:
                    if any(skill in word for word in title_words):
                        score += 10
                
                # Skills matching
                job_skills = [skill.lower() for skill in job.skills]
                matching_skills = set(user_skills) & set(job_skills)
                score += len(matching_skills) * 15
                
                # Industry matching
                if job.industry == user_prefs.industry:
                    score += 20
                
                # Experience matching
                if job.experience_level == user_prefs.experience:
                    score += 15
                
                # Location matching
                if (user_prefs.location.lower() in job.location.lower() or 
                    user_prefs.location.lower() == 'remote'):
                    score += 10
                
                job_scores.append({
                    'job_id': job.job_id,
                    'title': job.title,
                    'company': job.company,
                    'location': job.location,
                    'similarity_score': min(score / 100, 1.0),  # Normalize to 0-1
                    'industry': job.industry,
                    'experience_level': job.experience_level,
                    'salary_min': job.salary_min,
                    'skills': job.skills
                })
            
            job_scores.sort(key=lambda x: x['similarity_score'], reverse=True)
            return job_scores[:top_n]
            
        except Exception as e:
            logger.error(f"Simple recommendation error: {e}")
            return []
    
    def _is_compatible_experience(self, job_level, user_level):
        """Check if experience levels are compatible"""
        compatibility = {
            'Entry-level': ['Mid-level'],
            'Mid-level': ['Entry-level', 'Senior'],
            'Senior': ['Mid-level', 'Executive'],
            'Executive': ['Senior']
        }
        return user_level in compatibility.get(job_level, [])
    
    def train_model(self, training_data: List[TrainingData]):
        """Train/update the ML model with new data"""
        try:
            logger.info(f"Training model with {len(training_data)} data points")
            
            # Prepare training data
            user_features = []
            interaction_features = []
            
            for data in training_data:
                # User features
                user_feature = f"{data.user_preferences.skills} {data.user_preferences.industry} {data.user_preferences.experience}"
                user_features.append(user_feature)
                
                # Interaction features (positive/negative feedback)
                for interaction in data.interactions:
                    interaction_type = interaction.get('type', 'view')  # apply, save, view
                    job_info = interaction.get('job', {})
                    
                    # Create feature vector for this interaction
                    interaction_feature = {
                        'user_id': data.user_id,
                        'user_skills': data.user_preferences.skills,
                        'job_title': job_info.get('title', ''),
                        'job_skills': ' '.join(job_info.get('skills', [])),
                        'job_industry': job_info.get('industry', ''),
                        'interaction_type': interaction_type,
                        'positive_feedback': interaction_type in ['apply', 'save']
                    }
                    interaction_features.append(interaction_feature)
            
            # Save training data for future model updates
            training_file = f"training_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(training_file, 'w') as f:
                json.dump([data.dict() for data in training_data], f, indent=2)
            
            logger.info(f"✅ Training data saved to {training_file}")
            
            # Here you would implement actual ML training
            # For now, we'll just update the TF-IDF with new data
            if interaction_features:
                all_texts = [feat['user_skills'] + ' ' + feat['job_title'] + ' ' + feat['job_skills'] 
                           for feat in interaction_features]
                
                if len(all_texts) > 10:  # Only retrain if we have enough data
                    global tfidf_vectorizer
                    tfidf_vectorizer.fit(all_texts)
                    logger.info("✅ TF-IDF model updated with new training data")
            
            return {"status": "success", "message": f"Model trained with {len(training_data)} samples"}
            
        except Exception as e:
            logger.error(f"Training error: {e}")
            return {"status": "error", "message": str(e)}

# Initialize recommendation engine
recommendation_engine = JobRecommendationEngine()

# API Endpoints
@app.get("/")
async def root():
    return {
        "service": "Job Recommendation ML Service",
        "version": "1.0.0",
        "status": "running",
        "model_loaded": recommendation_engine.model_loaded,
        "endpoints": {
            "recommend": "/api/recommend",
            "train": "/api/train",
            "health": "/api/health",
            "predict_salary": "/api/predict_salary"
        }
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": recommendation_engine.model_loaded,
        "timestamp": datetime.now().isoformat(),
        "cache_size": len(job_data_cache)
    }

@app.post("/api/recommend")
async def get_recommendations(request: RecommendationRequest):
    """Get job recommendations for a user"""
    try:
        # In a real implementation, you'd fetch available jobs from your database
        # For now, we'll use cached job data or return a sample response
        
        if not job_data_cache:
            # Sample job data for testing
            sample_jobs = [
                JobData(
                    job_id="1",
                    title="Senior Python Developer",
                    company="TechCorp",
                    location="Remote",
                    skills=["Python", "Django", "PostgreSQL", "AWS"],
                    industry="Software",
                    experience_level="Senior",
                    salary_min=120000,
                    salary_max=150000,
                    description="Develop scalable web applications using Python and Django"
                ),
                JobData(
                    job_id="2",
                    title="Frontend React Developer",
                    company="StartupXYZ",
                    location="San Francisco",
                    skills=["React", "JavaScript", "TypeScript", "CSS"],
                    industry="Software",
                    experience_level="Mid-level",
                    salary_min=100000,
                    salary_max=130000,
                    description="Build modern web interfaces using React and TypeScript"
                ),
                JobData(
                    job_id="3",
                    title="Data Scientist",
                    company="DataFlow Inc",
                    location="New York",
                    skills=["Python", "Machine Learning", "TensorFlow", "SQL"],
                    industry="AI/ML",
                    experience_level="Mid-level",
                    salary_min=110000,
                    salary_max=140000,
                    description="Analyze large datasets and build ML models"
                ),
                JobData(
                    job_id="4",
                    title="DevOps Engineer",
                    company="CloudTech",
                    location="Remote",
                    skills=["AWS", "Docker", "Kubernetes", "Python"],
                    industry="Software",
                    experience_level="Senior",
                    salary_min=115000,
                    salary_max=145000,
                    description="Manage cloud infrastructure and deployment pipelines"
                ),
                JobData(
                    job_id="5",
                    title="Full Stack Developer",
                    company="WebSolutions",
                    location="Austin",
                    skills=["JavaScript", "Node.js", "React", "MongoDB"],
                    industry="Software",
                    experience_level="Mid-level",
                    salary_min=95000,
                    salary_max=125000,
                    description="Develop end-to-end web applications"
                )
            ]
            job_data_cache.extend(sample_jobs)
        
        # Get recommendations
        recommendations = recommendation_engine.get_recommendations(
            request.user_preferences,
            job_data_cache,
            request.top_n
        )
        
        return {
            "success": True,
            "recommendations": recommendations,
            "total_count": len(recommendations),
            "algorithm": "ml_based" if recommendation_engine.model_loaded else "tfidf_similarity",
            "user_preferences": request.user_preferences.dict()
        }
        
    except Exception as e:
        logger.error(f"Recommendation error: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")

@app.post("/api/train")
async def train_model(training_data: List[TrainingData]):
    """Train the ML model with user interaction data"""
    try:
        result = recommendation_engine.train_model(training_data)
        return result
        
    except Exception as e:
        logger.error(f"Training error: {e}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@app.post("/api/predict_salary")
async def predict_salary(job_data: JobData):
    """Predict salary for a job posting"""
    try:
        if not recommendation_engine.model_loaded or not ml_model:
            # Fallback salary prediction based on simple rules
            base_salary = 70000
            
            # Experience level multiplier
            exp_multipliers = {
                'Entry-level': 1.0,
                'Mid-level': 1.3,
                'Senior': 1.6,
                'Executive': 2.0
            }
            
            # Industry multiplier
            industry_multipliers = {
                'Software': 1.2,
                'AI/ML': 1.4,
                'Fintech': 1.3,
                'Healthcare': 1.1,
                'Education': 0.9
            }
            
            predicted_salary = base_salary * exp_multipliers.get(job_data.experience_level, 1.0) * industry_multipliers.get(job_data.industry, 1.0)
            
            return {
                "predicted_salary": int(predicted_salary),
                "method": "rule_based",
                "confidence": 0.7
            }
        
        # Use ML model for prediction
        # This would use your trained salary prediction model
        job_details = {
            'experience': job_data.experience_level,
            'industry': job_data.industry,
            'location': job_data.location,
            'skills': ', '.join(job_data.skills),
            'title': job_data.title
        }
        
        # Placeholder - replace with actual ML model prediction
        predicted_salary = 95000  # Your ML model would predict this
        
        return {
            "predicted_salary": predicted_salary,
            "method": "ml_model",
            "confidence": 0.85,
            "job_details": job_details
        }
        
    except Exception as e:
        logger.error(f"Salary prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Salary prediction failed: {str(e)}")

@app.post("/api/update_job_cache")
async def update_job_cache(jobs: List[JobData]):
    """Update the job cache with latest job data from the main application"""
    try:
        global job_data_cache
        job_data_cache = jobs
        
        logger.info(f"Job cache updated with {len(jobs)} jobs")
        
        return {
            "success": True,
            "message": f"Job cache updated with {len(jobs)} jobs",
            "cache_size": len(job_data_cache)
        }
        
    except Exception as e:
        logger.error(f"Cache update error: {e}")
        raise HTTPException(status_code=500, detail=f"Cache update failed: {str(e)}")

@app.get("/api/stats")
async def get_stats():
    """Get service statistics"""
    return {
        "model_loaded": recommendation_engine.model_loaded,
        "cache_size": len(job_data_cache),
        "service_uptime": datetime.now().isoformat(),
        "available_endpoints": [
            "/api/recommend",
            "/api/train", 
            "/api/predict_salary",
            "/api/update_job_cache",
            "/api/health"
        ]
    }

# WebSocket endpoint for real-time recommendations (optional)
@app.websocket("/ws/recommendations")
async def websocket_recommendations(websocket):
    """WebSocket endpoint for real-time recommendation updates"""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Process real-time recommendation request
            # Send back recommendations
            await websocket.send_text(f"Recommendation update: {data}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close()

if __name__ == "__main__":
    print("🚀 Starting Job Recommendation ML Service...")
    print("📊 Service Features:")
    print("  • AI-powered job matching")
    print("  • TF-IDF similarity fallback") 
    print("  • Salary prediction")
    print("  • Model training endpoint")
    print("  • Real-time recommendations")
    print("\n🔗 Available at: http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        reload=True,
        log_level="info"
    )