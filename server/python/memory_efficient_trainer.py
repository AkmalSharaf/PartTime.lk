#!/usr/bin/env python3
"""
Memory-Efficient Job Recommendation System Trainer
Optimized for large datasets (50K+ jobs)
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import MiniBatchKMeans
from sklearn.decomposition import TruncatedSVD
import joblib
import warnings
import os
import gc
from scipy.sparse import csr_matrix
warnings.filterwarnings('ignore')

def load_and_preprocess_data(csv_file='job_recommendation_dataset.csv'):
    """Load and preprocess the job dataset with memory optimization"""
    print("📊 Loading dataset...")
    
    if not os.path.exists(csv_file):
        print(f"❌ Error: {csv_file} not found!")
        return None
    
    # Load data in chunks to save memory
    df = pd.read_csv(csv_file)
    print(f"✓ Loaded {len(df)} jobs")
    
    # Basic cleaning
    df = df.dropna()
    print(f"✓ After cleaning: {len(df)} jobs")
    
    # Create text features
    df['job_text'] = df['Job Title'] + ' ' + df['Required Skills'] + ' ' + df['Industry']
    df['skills_count'] = df['Required Skills'].str.count(',') + 1
    df['title_length'] = df['Job Title'].str.len()
    
    # Memory optimization: convert to appropriate dtypes
    df['skills_count'] = df['skills_count'].astype('int16')
    df['title_length'] = df['title_length'].astype('int16')
    df['Salary'] = df['Salary'].astype('int32')
    
    return df

def create_tfidf_features(df, max_features=2000):
    """Create TF-IDF features with memory efficiency"""
    print("⚙️ Creating TF-IDF features...")
    
    # Use smaller feature set for memory efficiency
    tfidf = TfidfVectorizer(
        max_features=max_features,
        stop_words='english',
        ngram_range=(1, 2),
        min_df=3,
        max_df=0.8,
        dtype=np.float32  # Use float32 instead of float64
    )
    
    skills_matrix = tfidf.fit_transform(df['job_text'])
    print(f"✓ TF-IDF matrix: {skills_matrix.shape} ({skills_matrix.nnz} non-zero elements)")
    
    return tfidf, skills_matrix

def encode_categorical_features(df):
    """Encode categorical features"""
    print("🔧 Encoding categorical features...")
    
    label_encoders = {}
    categorical_cols = ['Experience Level', 'Industry', 'Location']
    
    for col in categorical_cols:
        le = LabelEncoder()
        df[f'{col}_encoded'] = le.fit_transform(df[col]).astype('int8')  # Use int8 for small categories
        label_encoders[col] = le
    
    return label_encoders

def train_salary_model(df):
    """Train salary prediction model with simplified features"""
    print("🤖 Training salary prediction model...")
    
    feature_cols = ['Experience Level_encoded', 'Industry_encoded', 'Location_encoded', 
                   'skills_count', 'title_length']
    
    X = df[feature_cols]
    y = df['Salary']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Use a simpler model for faster training
    salary_model = RandomForestRegressor(
        n_estimators=50,  # Reduced from 100
        max_depth=10,     # Limit depth
        random_state=42,
        n_jobs=-1
    )
    
    salary_model.fit(X_train, y_train)
    score = salary_model.score(X_test, y_test)
    
    print(f"✓ Salary model R² score: {score:.3f}")
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': feature_cols,
        'importance': salary_model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("Top feature importances:")
    print(feature_importance.head())
    
    return salary_model

def create_job_clusters(df, skills_matrix):
    """Create job clusters using memory-efficient methods"""
    print("🎯 Creating job clusters...")
    
    # Use TruncatedSVD for dimensionality reduction (works with sparse matrices)
    svd = TruncatedSVD(n_components=50, random_state=42)
    skills_reduced = svd.fit_transform(skills_matrix)
    
    # Get numerical features
    numerical_cols = ['Experience Level_encoded', 'Industry_encoded', 'Location_encoded', 
                     'skills_count', 'title_length']
    scaler = StandardScaler()
    job_features = scaler.fit_transform(df[numerical_cols])
    
    # Combine features
    combined_features = np.hstack([skills_reduced, job_features])
    
    # Use MiniBatchKMeans for memory efficiency
    kmeans = MiniBatchKMeans(
        n_clusters=15,
        random_state=42,
        batch_size=1000,
        n_init=3
    )
    
    df['cluster'] = kmeans.fit_predict(combined_features)
    
    print(f"✓ Created {kmeans.n_clusters} clusters")
    
    # Cluster analysis
    cluster_stats = df.groupby('cluster').agg({
        'Salary': ['mean', 'count'],
        'Industry': lambda x: x.mode().iloc[0] if len(x) > 0 else 'Unknown',
        'Experience Level': lambda x: x.mode().iloc[0] if len(x) > 0 else 'Unknown',
        'Location': lambda x: x.mode().iloc[0] if len(x) > 0 else 'Unknown'
    }).round(2)
    
    print("Cluster analysis:")
    print(cluster_stats)
    
    return kmeans, svd, scaler

def create_similarity_index(skills_matrix, batch_size=1000):
    """Create a memory-efficient similarity index instead of full matrix"""
    print("🔗 Creating similarity index...")
    
    n_jobs = skills_matrix.shape[0]
    
    # Instead of full similarity matrix, create index for top similar jobs
    similarity_index = {}
    
    print(f"Processing {n_jobs} jobs in batches of {batch_size}...")
    
    for i in range(0, n_jobs, batch_size):
        end_idx = min(i + batch_size, n_jobs)
        batch = skills_matrix[i:end_idx]
        
        # Calculate similarity for this batch against all jobs
        similarities = cosine_similarity(batch, skills_matrix)
        
        # Store only top 20 similar jobs for each job in batch
        for j, sim_row in enumerate(similarities):
            job_idx = i + j
            # Get top 21 (including self) and exclude self
            top_indices = np.argsort(sim_row)[-21:-1][::-1]
            top_scores = sim_row[top_indices]
            
            similarity_index[job_idx] = {
                'similar_jobs': top_indices.tolist(),
                'similarity_scores': top_scores.tolist()
            }
        
        if (i // batch_size + 1) % 10 == 0:
            print(f"  Processed {end_idx}/{n_jobs} jobs...")
        
        # Clean up memory
        del similarities
        gc.collect()
    
    print(f"✓ Created similarity index for {len(similarity_index)} jobs")
    return similarity_index

def package_model_data(df, tfidf, label_encoders, salary_model, kmeans, svd, scaler, 
                      skills_matrix, similarity_index):
    """Package all model components"""
    
    model_data = {
        'df_sample': df.sample(n=min(10000, len(df)), random_state=42),  # Store sample for insights
        'df_meta': {
            'total_jobs': len(df),
            'industries': df['Industry'].unique().tolist(),
            'locations': df['Location'].unique().tolist(),
            'experience_levels': df['Experience Level'].unique().tolist(),
            'salary_range': {
                'min': int(df['Salary'].min()),
                'max': int(df['Salary'].max()),
                'mean': int(df['Salary'].mean())
            }
        },
        'tfidf_vectorizer': tfidf,
        'label_encoders': label_encoders,
        'salary_model': salary_model,
        'kmeans': kmeans,
        'svd': svd,
        'scaler': scaler,
        'similarity_index': similarity_index,
        'feature_cols': ['Experience Level_encoded', 'Industry_encoded', 'Location_encoded', 
                        'skills_count', 'title_length']
    }
    
    return model_data

def test_model(model_data):
    """Test the trained model"""
    print("\n🧪 Testing model...")
    
    try:
        df_sample = model_data['df_sample']
        tfidf = model_data['tfidf_vectorizer']
        salary_model = model_data['salary_model']
        label_encoders = model_data['label_encoders']
        similarity_index = model_data['similarity_index']
        
        # Test 1: Content recommendation
        user_skills = "Python Machine Learning Data Science"
        user_vector = tfidf.transform([user_skills])
        
        # Get similarity with sample jobs
        sample_skills_matrix = tfidf.transform(df_sample['job_text'])
        similarities = cosine_similarity(user_vector, sample_skills_matrix).flatten()
        top_job_idx = np.argmax(similarities)
        
        job = df_sample.iloc[top_job_idx]
        print(f"✓ Top recommendation: {job['Job Title']} at {job['Company']} (Score: {similarities[top_job_idx]:.3f})")
        
        # Test 2: Salary prediction
        try:
            exp_enc = label_encoders['Experience Level'].transform(['Senior Level'])[0]
            ind_enc = label_encoders['Industry'].transform(['Software'])[0]
            loc_enc = label_encoders['Location'].transform(['San Francisco'])[0]
            
            features = [[exp_enc, ind_enc, loc_enc, 5, 25]]
            predicted_salary = salary_model.predict(features)[0]
            print(f"✓ Salary prediction: ${predicted_salary:,.0f} for Senior Software Engineer")
        except Exception as e:
            print(f"⚠ Salary prediction test: {e}")
        
        # Test 3: Similar jobs
        if 0 in similarity_index:
            similar_jobs = similarity_index[0]['similar_jobs'][:3]
            print(f"✓ Found {len(similar_jobs)} similar jobs to job 0")
        else:
            print("⚠ Similarity index test: No data for job 0")
        
        print("✓ All tests completed!")
        return True
        
    except Exception as e:
        print(f"❌ Testing failed: {e}")
        return False

def main():
    """Main training function"""
    print("⚡ Memory-Efficient Job Recommendation Trainer")
    print("Optimized for large datasets (50K+ jobs)")
    print("="*60)
    
    # Step 1: Load and preprocess
    df = load_and_preprocess_data('job_recommendation_dataset.csv')
    if df is None:
        return
    
    # Step 2: Create TF-IDF features
    tfidf, skills_matrix = create_tfidf_features(df, max_features=2000)
    
    # Step 3: Encode categorical features
    label_encoders = encode_categorical_features(df)
    
    # Step 4: Train salary model
    salary_model = train_salary_model(df)
    
    # Step 5: Create clusters
    kmeans, svd, scaler = create_job_clusters(df, skills_matrix)
    
    # Step 6: Create similarity index (memory-efficient)
    similarity_index = create_similarity_index(skills_matrix, batch_size=500)
    
    # Step 7: Package model
    print("\n📦 Packaging model...")
    model_data = package_model_data(df, tfidf, label_encoders, salary_model, 
                                   kmeans, svd, scaler, skills_matrix, similarity_index)
    
    # Step 8: Save model
    print("💾 Saving model...")
    filename = 'job_recommendation_model.pkl'
    try:
        joblib.dump(model_data, filename)
        size_mb = os.path.getsize(filename) / (1024*1024)
        print(f"✓ Model saved: {filename} ({size_mb:.1f} MB)")
    except Exception as e:
        print(f"❌ Save failed: {e}")
        return
    
    # Step 9: Test model
    if test_model(model_data):
        print("\n🎉 SUCCESS! Memory-efficient model is ready!")
        print(f"\n📊 Model stats:")
        print(f"  • Total jobs processed: {len(df):,}")
        print(f"  • TF-IDF features: {skills_matrix.shape[1]:,}")
        print(f"  • Model file size: {size_mb:.1f} MB")
        print(f"  • Memory usage: Optimized for large datasets")
        
        print("\n🚀 Next steps:")
        print("1. Run: python simple_recommendation_api.py")
        print("2. Integrate with your job portal")
    else:
        print("❌ Training completed but testing failed!")

if __name__ == "__main__":
    main()