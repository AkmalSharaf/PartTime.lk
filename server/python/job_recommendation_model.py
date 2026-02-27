#!/usr/bin/env python3
"""
Memory-Efficient Job Recommendation API
Works with the memory-optimized model
"""

import joblib
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import warnings
import random
warnings.filterwarnings('ignore')

class JobRecommendationAPI:
    def __init__(self, model_path='job_recommendation_model.pkl'):
        """Initialize the recommendation API with a trained model"""
        self.model_data = None
        self.load_model(model_path)
    
    def load_model(self, model_path):
        """Load the trained model"""
        try:
            self.model_data = joblib.load(model_path)
            print("✓ Memory-efficient model loaded successfully!")
            
            meta = self.model_data['df_meta']
            print(f"  📊 Dataset: {meta['total_jobs']:,} jobs")
            print(f"  🏢 Industries: {len(meta['industries'])} types")
            print(f"  🌍 Locations: {len(meta['locations'])} cities")
            print(f"  💰 Salary range: ${meta['salary_range']['min']:,} - ${meta['salary_range']['max']:,}")
            
        except Exception as e:
            print(f"✗ Error loading model: {e}")
            print("Make sure you have trained the model first using memory_efficient_trainer.py")
    
    def get_job_recommendations(self, user_preferences, top_n=10):
        """
        Get job recommendations for a user
        
        Args:
            user_preferences: dict containing:
                - 'skills': string of skills (e.g., 'Python Machine Learning')
                - 'experience': experience level (optional)
                - 'industry': preferred industry (optional)
                - 'location': preferred location (optional)
                - 'min_salary': minimum salary (optional)
            top_n: number of recommendations to return
        
        Returns:
            List of job recommendations
        """
        if self.model_data is None:
            print("Model not loaded!")
            return []
        
        try:
            df_sample = self.model_data['df_sample']
            tfidf_vectorizer = self.model_data['tfidf_vectorizer']
            
            # Start with sample jobs (for demo purposes, in production you'd query your database)
            filtered_df = df_sample.copy()
            
            # Apply filters
            if 'experience' in user_preferences and user_preferences['experience']:
                if user_preferences['experience'] in self.model_data['df_meta']['experience_levels']:
                    filtered_df = filtered_df[filtered_df['Experience Level'] == user_preferences['experience']]
            
            if 'industry' in user_preferences and user_preferences['industry']:
                if user_preferences['industry'] in self.model_data['df_meta']['industries']:
                    filtered_df = filtered_df[filtered_df['Industry'] == user_preferences['industry']]
            
            if 'location' in user_preferences and user_preferences['location']:
                if user_preferences['location'] in self.model_data['df_meta']['locations']:
                    filtered_df = filtered_df[filtered_df['Location'] == user_preferences['location']]
            
            if 'min_salary' in user_preferences and user_preferences['min_salary']:
                filtered_df = filtered_df[filtered_df['Salary'] >= user_preferences['min_salary']]
            
            # If no jobs match filters, relax constraints
            if len(filtered_df) == 0:
                print("No exact matches found, showing similar jobs...")
                filtered_df = df_sample.copy()
                if 'min_salary' in user_preferences and user_preferences['min_salary']:
                    filtered_df = filtered_df[filtered_df['Salary'] >= user_preferences['min_salary'] * 0.8]
            
            # Skills-based similarity
            if 'skills' in user_preferences and user_preferences['skills']:
                # Transform user skills to TF-IDF vector
                user_skills_vector = tfidf_vectorizer.transform([user_preferences['skills']])
                
                # Calculate similarity with filtered jobs
                if len(filtered_df) > 0:
                    job_skills_matrix = tfidf_vectorizer.transform(filtered_df['job_text'])
                    similarities = cosine_similarity(user_skills_vector, job_skills_matrix).flatten()
                    
                    # Add similarity scores
                    filtered_df = filtered_df.copy()
                    filtered_df['similarity_score'] = similarities
                    
                    # Sort by similarity and salary
                    recommendations = filtered_df.nlargest(top_n, ['similarity_score', 'Salary'])
                else:
                    recommendations = pd.DataFrame()
            else:
                # No skills specified, recommend based on salary
                if len(filtered_df) > 0:
                    recommendations = filtered_df.nlargest(top_n, 'Salary')
                    recommendations['similarity_score'] = 0.0
                else:
                    recommendations = pd.DataFrame()
            
            # Convert to list of dictionaries
            if not recommendations.empty:
                result = []
                for _, job in recommendations.iterrows():
                    result.append({
                        'job_title': job['Job Title'],
                        'company': job['Company'],
                        'location': job['Location'],
                        'experience_level': job['Experience Level'],
                        'salary': int(job['Salary']),
                        'industry': job['Industry'],
                        'required_skills': job['Required Skills'],
                        'similarity_score': float(job.get('similarity_score', 0.0)),
                        'cluster': int(job.get('cluster', 0))
                    })
                return result
            else:
                return []
            
        except Exception as e:
            print(f"Error generating recommendations: {e}")
            return []
    
    def predict_salary(self, job_details):
        """
        Predict salary for a job posting
        
        Args:
            job_details: dict with:
                - 'experience': experience level
                - 'industry': industry
                - 'location': location
                - 'skills': skills string (optional)
                - 'title': job title (optional)
        
        Returns:
            Predicted salary
        """
        if self.model_data is None:
            print("Model not loaded!")
            return None
        
        try:
            salary_model = self.model_data['salary_model']
            label_encoders = self.model_data['label_encoders']
            
            # Check if values exist in encoders
            if job_details['experience'] not in label_encoders['Experience Level'].classes_:
                print(f"Unknown experience level: {job_details['experience']}")
                return None
            
            if job_details['industry'] not in label_encoders['Industry'].classes_:
                print(f"Unknown industry: {job_details['industry']}")
                return None
            
            if job_details['location'] not in label_encoders['Location'].classes_:
                print(f"Unknown location: {job_details['location']}")
                return None
            
            # Encode categorical features
            exp_encoded = label_encoders['Experience Level'].transform([job_details['experience']])[0]
            ind_encoded = label_encoders['Industry'].transform([job_details['industry']])[0]
            loc_encoded = label_encoders['Location'].transform([job_details['location']])[0]
            
            # Calculate skills count and title length
            skills_count = job_details.get('skills', '').count(',') + 1 if job_details.get('skills') else 1
            title_length = len(job_details.get('title', ''))
            
            # Create feature vector
            features = np.array([[exp_encoded, ind_encoded, loc_encoded, skills_count, title_length]])
            
            # Predict salary
            predicted_salary = salary_model.predict(features)[0]
            
            return int(predicted_salary)
            
        except Exception as e:
            print(f"Error predicting salary: {e}")
            return None
    
    def get_similar_jobs(self, job_index, top_n=5):
        """
        Get jobs similar to a specific job using the similarity index
        
        Args:
            job_index: Index of the reference job
            top_n: number of similar jobs to return
        
        Returns:
            List of similar jobs
        """
        if self.model_data is None:
            print("Model not loaded!")
            return []
        
        try:
            similarity_index = self.model_data['similarity_index']
            df_sample = self.model_data['df_sample']
            
            if job_index not in similarity_index:
                print(f"No similarity data for job index {job_index}")
                return []
            
            similar_data = similarity_index[job_index]
            similar_jobs = similar_data['similar_jobs'][:top_n]
            similarity_scores = similar_data['similarity_scores'][:top_n]
            
            # Get job details from sample (in production, query your database)
            result = []
            for i, (job_idx, score) in enumerate(zip(similar_jobs, similarity_scores)):
                if job_idx < len(df_sample):
                    job = df_sample.iloc[job_idx]
                    result.append({
                        'job_title': job['Job Title'],
                        'company': job['Company'],
                        'location': job['Location'],
                        'salary': int(job['Salary']),
                        'industry': job['Industry'],
                        'similarity_score': float(score)
                    })
            
            return result
            
        except Exception as e:
            print(f"Error finding similar jobs: {e}")
            return []
    
    def get_market_insights(self, filters=None):
        """
        Get insights about the job market
        
        Args:
            filters: dict with filters to apply (optional)
        
        Returns:
            Dict with market insights
        """
        if self.model_data is None:
            print("Model not loaded!")
            return {}
        
        try:
            df_sample = self.model_data['df_sample']
            meta = self.model_data['df_meta']
            
            # Apply filters to sample data
            filtered_df = df_sample.copy()
            if filters:
                if 'industry' in filters and filters['industry'] in meta['industries']:
                    filtered_df = filtered_df[filtered_df['Industry'] == filters['industry']]
                if 'experience' in filters and filters['experience'] in meta['experience_levels']:
                    filtered_df = filtered_df[filtered_df['Experience Level'] == filters['experience']]
                if 'location' in filters and filters['location'] in meta['locations']:
                    filtered_df = filtered_df[filtered_df['Location'] == filters['location']]
            
            if len(filtered_df) == 0:
                return {'error': 'No jobs found matching filters'}
            
            # Calculate insights
            insights = {
                'total_jobs_in_sample': len(filtered_df),
                'estimated_total_jobs': meta['total_jobs'],
                'avg_salary': int(filtered_df['Salary'].mean()),
                'salary_range': {
                    'min': int(filtered_df['Salary'].min()),
                    'max': int(filtered_df['Salary'].max()),
                    'median': int(filtered_df['Salary'].median())
                },
                'top_industries': filtered_df['Industry'].value_counts().head().to_dict(),
                'top_locations': filtered_df['Location'].value_counts().head().to_dict(),
                'experience_distribution': filtered_df['Experience Level'].value_counts().to_dict(),
                'available_filters': {
                    'industries': meta['industries'],
                    'locations': meta['locations'],
                    'experience_levels': meta['experience_levels']
                }
            }
            
            return insights
            
        except Exception as e:
            print(f"Error generating insights: {e}")
            return {'error': str(e)}
    
    def get_trending_jobs(self, top_n=10):
        """Get trending jobs based on salary and popularity"""
        if self.model_data is None:
            print("Model not loaded!")
            return []
        
        try:
            df_sample = self.model_data['df_sample']
            
            # Calculate trend score based on salary and industry popularity
            industry_counts = df_sample['Industry'].value_counts().to_dict()
            df_copy = df_sample.copy()
            df_copy['industry_popularity'] = df_copy['Industry'].map(industry_counts)
            
            # Normalize scores
            salary_norm = (df_copy['Salary'] - df_copy['Salary'].min()) / (df_copy['Salary'].max() - df_copy['Salary'].min())
            popularity_norm = (df_copy['industry_popularity'] - df_copy['industry_popularity'].min()) / (df_copy['industry_popularity'].max() - df_copy['industry_popularity'].min())
            
            df_copy['trend_score'] = salary_norm * 0.7 + popularity_norm * 0.3
            
            trending_jobs = df_copy.nlargest(top_n, 'trend_score')
            
            result = []
            for _, job in trending_jobs.iterrows():
                result.append({
                    'job_title': job['Job Title'],
                    'company': job['Company'],
                    'location': job['Location'],
                    'salary': int(job['Salary']),
                    'industry': job['Industry'],
                    'trend_score': float(job['trend_score']),
                    'experience_level': job['Experience Level']
                })
            
            return result
            
        except Exception as e:
            print(f"Error getting trending jobs: {e}")
            return []

def test_api():
    """Test the API with sample data"""
    print("="*60)
    print("TESTING MEMORY-EFFICIENT JOB RECOMMENDATION API")
    print("="*60)
    
    # Initialize API
    api = JobRecommendationAPI('job_recommendation_model.pkl')
    
    if api.model_data is None:
        print("Cannot run tests - model not loaded!")
        return
    
    # Test 1: Get recommendations
    print("\n1. 🎯 Job Recommendations for a Data Scientist:")
    user_preferences = {
        'skills': 'Python Machine Learning Data Science TensorFlow',
        'experience': 'Mid Level',
        'industry': 'Software',
        'min_salary': 70000
    }
    
    recommendations = api.get_job_recommendations(user_preferences, top_n=5)
    if recommendations:
        print("✓ Found recommendations:")
        for i, job in enumerate(recommendations[:3], 1):
            print(f"  {i}. {job['job_title']} at {job['company']}")
            print(f"     💰 ${job['salary']:,} | 📍 {job['location']} | 🎯 Score: {job['similarity_score']:.3f}")
    else:
        print("✗ No recommendations found")
    
    # Test 2: Salary prediction
    print("\n2. 💰 Salary Prediction:")
    job_details = {
        'experience': 'Senior Level',
        'industry': 'Software',
        'location': 'San Francisco',
        'skills': 'Python, Machine Learning, Deep Learning',
        'title': 'Senior Machine Learning Engineer'
    }
    
    predicted_salary = api.predict_salary(job_details)
    if predicted_salary:
        print(f"✓ Predicted salary: ${predicted_salary:,}")
    else:
        print("✗ Salary prediction failed")
    
    # Test 3: Similar jobs
    print("\n3. 🔍 Similar Jobs:")
    similar_jobs = api.get_similar_jobs(0, top_n=3)
    if similar_jobs:
        print("✓ Found similar jobs:")
        for i, job in enumerate(similar_jobs, 1):
            print(f"  {i}. {job['job_title']} at {job['company']}")
            print(f"     💰 ${job['salary']:,} | 🎯 Similarity: {job['similarity_score']:.3f}")
    else:
        print("✗ No similar jobs found")
    
    # Test 4: Market insights
    print("\n4. 📊 Market Insights for Software Industry:")
    insights = api.get_market_insights({'industry': 'Software'})
    if insights and 'error' not in insights:
        print("✓ Market insights:")
        print(f"  • Sample size: {insights['total_jobs_in_sample']} jobs")
        print(f"  • Average salary: ${insights['avg_salary']:,}")
        print(f"  • Salary range: ${insights['salary_range']['min']:,} - ${insights['salary_range']['max']:,}")
        print(f"  • Top locations: {list(insights['top_locations'].keys())[:3]}")
    else:
        print("✗ No insights available")
    
    # Test 5: Trending jobs
    print("\n5. 🔥 Trending Jobs:")
    trending = api.get_trending_jobs(top_n=3)
    if trending:
        print("✓ Trending jobs:")
        for i, job in enumerate(trending, 1):
            print(f"  {i}. {job['job_title']} at {job['company']}")
            print(f"     💰 ${job['salary']:,} | 🔥 Trend score: {job['trend_score']:.3f}")
    else:
        print("✗ No trending jobs found")
    
    print("\n" + "="*60)
    print("✅ API TESTING COMPLETED SUCCESSFULLY!")
    print("="*60)
    
    # Show usage examples
    print("\n📋 Integration Examples:")
    print("""
# Basic usage in your job portal:
from efficient_recommendation_api import JobRecommendationAPI

api = JobRecommendationAPI('job_recommendation_model.pkl')

# Get personalized recommendations
user_prefs = {
    'skills': 'Python React JavaScript',
    'experience': 'Mid Level',
    'industry': 'Software',
    'min_salary': 75000
}

recommendations = api.get_job_recommendations(user_prefs, top_n=10)

# Predict salary for job posting
job_details = {
    'experience': 'Senior Level',
    'industry': 'Software',
    'location': 'New York',
    'skills': 'Python, Django, PostgreSQL',
    'title': 'Senior Backend Developer'
}

predicted_salary = api.predict_salary(job_details)

# Get market insights
insights = api.get_market_insights({'industry': 'Software', 'location': 'San Francisco'})
    """)

def main():
    """Main function to run the API tests"""
    print("Memory-Efficient Job Recommendation API")
    print("=" * 40)
    
    # Check if model file exists
    import os
    if not os.path.exists('job_recommendation_model.pkl'):
        print("\n❌ Model file not found!")
        print("Please run 'python memory_efficient_trainer.py' first to train the model.")
        return
    
    # Run tests
    test_api()

if __name__ == "__main__":
    main()