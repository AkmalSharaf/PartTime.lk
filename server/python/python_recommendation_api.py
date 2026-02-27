#!/usr/bin/env python3
"""
Python API Wrapper for Job Recommendations
Integrates with Node.js backend
"""

import sys
import json
import traceback
from job_recommendation_model import JobRecommendationAPI

class RecommendationAPIWrapper:
    def __init__(self):
        try:
            self.api = JobRecommendationAPI('job_recommendation_model.pkl')
            self.is_ready = self.api.model_data is not None
        except Exception as e:
            print(f"Error initializing API: {e}", file=sys.stderr)
            self.api = None
            self.is_ready = False
    
    def get_recommendations(self, user_preferences, top_n=20):
        """Get job recommendations for a user"""
        try:
            if not self.is_ready:
                return {"error": "Model not ready", "recommendations": []}
            
            # Convert Node.js preferences to Python format
            processed_prefs = self.process_user_preferences(user_preferences)
            
            # Get recommendations from AI model
            recommendations = self.api.get_job_recommendations(processed_prefs, top_n)
            
            # Format for Node.js consumption
            formatted_recs = self.format_recommendations(recommendations)
            
            return {
                "success": True,
                "count": len(formatted_recs),
                "recommendations": formatted_recs,
                "user_preferences": processed_prefs
            }
            
        except Exception as e:
            error_msg = f"Error getting recommendations: {str(e)}"
            print(error_msg, file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            return {"error": error_msg, "recommendations": []}
    
    def predict_salary(self, job_details):
        """Predict salary for a job"""
        try:
            if not self.is_ready:
                return {"error": "Model not ready", "predicted_salary": None}
            
            predicted = self.api.predict_salary(job_details)
            
            return {
                "success": True,
                "predicted_salary": predicted,
                "job_details": job_details
            }
            
        except Exception as e:
            error_msg = f"Error predicting salary: {str(e)}"
            print(error_msg, file=sys.stderr)
            return {"error": error_msg, "predicted_salary": None}
    
    def get_market_insights(self, filters=None):
        """Get market insights"""
        try:
            if not self.is_ready:
                return {"error": "Model not ready", "insights": {}}
            
            insights = self.api.get_market_insights(filters or {})
            
            return {
                "success": True,
                "insights": insights,
                "filters": filters
            }
            
        except Exception as e:
            error_msg = f"Error getting insights: {str(e)}"
            print(error_msg, file=sys.stderr)
            return {"error": error_msg, "insights": {}}
    
    def get_trending_jobs(self, top_n=10):
        """Get trending jobs"""
        try:
            if not self.is_ready:
                return {"error": "Model not ready", "trending_jobs": []}
            
            trending = self.api.get_trending_jobs(top_n)
            formatted_trending = self.format_recommendations(trending)
            
            return {
                "success": True,
                "count": len(formatted_trending),
                "trending_jobs": formatted_trending
            }
            
        except Exception as e:
            error_msg = f"Error getting trending jobs: {str(e)}"
            print(error_msg, file=sys.stderr)
            return {"error": error_msg, "trending_jobs": []}
    
    def get_similar_jobs(self, job_index, top_n=5):
        """Get similar jobs"""
        try:
            if not self.is_ready:
                return {"error": "Model not ready", "similar_jobs": []}
            
            similar = self.api.get_similar_jobs(int(job_index), top_n)
            formatted_similar = self.format_recommendations(similar)
            
            return {
                "success": True,
                "count": len(formatted_similar),
                "similar_jobs": formatted_similar
            }
            
        except Exception as e:
            error_msg = f"Error getting similar jobs: {str(e)}"
            print(error_msg, file=sys.stderr)
            return {"error": error_msg, "similar_jobs": []}
    
    def process_user_preferences(self, user_prefs):
        """Process user preferences from Node.js format"""
        processed = {}
        
        # Skills
        if 'skills' in user_prefs and user_prefs['skills']:
            processed['skills'] = user_prefs['skills']
        
        # Experience level
        if 'experience' in user_prefs and user_prefs['experience']:
            processed['experience'] = user_prefs['experience']
        
        # Industry
        if 'industry' in user_prefs and user_prefs['industry']:
            processed['industry'] = user_prefs['industry']
        
        # Location
        if 'location' in user_prefs and user_prefs['location']:
            processed['location'] = user_prefs['location']
        
        # Salary
        if 'min_salary' in user_prefs and user_prefs['min_salary']:
            try:
                processed['min_salary'] = int(user_prefs['min_salary'])
            except (ValueError, TypeError):
                processed['min_salary'] = 0
        
        # Remote preference
        if 'remote_preference' in user_prefs:
            processed['remote_preference'] = bool(user_prefs['remote_preference'])
        
        # Job types
        if 'job_types' in user_prefs and user_prefs['job_types']:
            processed['job_types'] = user_prefs['job_types']
        
        return processed
    
    def format_recommendations(self, recommendations):
        """Format recommendations for Node.js consumption"""
        formatted = []
        
        for rec in recommendations:
            if isinstance(rec, dict):
                formatted_rec = {
                    'job_title': rec.get('job_title', ''),
                    'company': rec.get('company', ''),
                    'location': rec.get('location', ''),
                    'experience_level': rec.get('experience_level', ''),
                    'salary': rec.get('salary', 0),
                    'industry': rec.get('industry', ''),
                    'required_skills': rec.get('required_skills', ''),
                    'similarity_score': rec.get('similarity_score', 0.0),
                    'cluster': rec.get('cluster', 0),
                    'trend_score': rec.get('trend_score', 0.0),
                    'ai_metadata': {
                        'source': 'ai_model',
                        'confidence': rec.get('similarity_score', 0.0),
                        'cluster_id': rec.get('cluster', 0)
                    }
                }
                formatted.append(formatted_rec)
        
        return formatted

def main():
    """Main function to handle command line arguments"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided"}))
        return
    
    command = sys.argv[1]
    wrapper = RecommendationAPIWrapper()
    
    try:
        if command == "get_recommendations":
            if len(sys.argv) < 4:
                print(json.dumps({"error": "Missing parameters for recommendations"}))
                return
            
            user_prefs = json.loads(sys.argv[2])
            top_n = int(sys.argv[3]) if len(sys.argv) > 3 else 20
            
            result = wrapper.get_recommendations(user_prefs, top_n)
            print(json.dumps(result))
        
        elif command == "predict_salary":
            if len(sys.argv) < 3:
                print(json.dumps({"error": "Missing job details for salary prediction"}))
                return
            
            job_details = json.loads(sys.argv[2])
            result = wrapper.predict_salary(job_details)
            print(json.dumps(result))
        
        elif command == "get_insights":
            filters = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
            result = wrapper.get_market_insights(filters)
            print(json.dumps(result))
        
        elif command == "get_trending":
            top_n = int(sys.argv[2]) if len(sys.argv) > 2 else 10
            result = wrapper.get_trending_jobs(top_n)
            print(json.dumps(result))
        
        elif command == "get_similar":
            if len(sys.argv) < 3:
                print(json.dumps({"error": "Missing job index for similar jobs"}))
                return
            
            job_index = sys.argv[2]
            top_n = int(sys.argv[3]) if len(sys.argv) > 3 else 5
            result = wrapper.get_similar_jobs(job_index, top_n)
            print(json.dumps(result))
        
        elif command == "health_check":
            result = {
                "success": True,
                "model_ready": wrapper.is_ready,
                "version": "1.0.0",
                "status": "healthy" if wrapper.is_ready else "model_not_loaded"
            }
            print(json.dumps(result))
        
        else:
            print(json.dumps({"error": f"Unknown command: {command}"}))
    
    except Exception as e:
        error_result = {
            "error": f"Command execution failed: {str(e)}",
            "command": command,
            "traceback": traceback.format_exc()
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    main()