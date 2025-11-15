from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
import json
from dotenv import load_dotenv
import re

load_dotenv()
app = Flask(__name__)
CORS(app)

class QuestionSolver:
    def __init__(self):
        self.groq_api_key = os.getenv('GROQ_API_KEY')
        self.youtube_api_key = os.getenv('YOUTUBE_API_KEY')
        self.groq_base_url = "https://api.groq.com/openai/v1/chat/completions"
        self.youtube_base_url = "https://www.googleapis.com/youtube/v3/search"
        
    def solve_question(self, question, doubt):
        headers = {
            'Authorization': f'Bearer {self.groq_api_key}',
            'Content-Type': 'application/json'
        }
        
        prompt = f"""Solve this academic problem in exactly 500 words or less in markdown format:

Question: {question}
Student's Doubt: {doubt}

Provide:
1. Complete step-by-step solution
2. All relevant formulas
3. Key concepts explained
4. Final answer

Format in clean markdown. Be concise but comprehensive."""

        payload = {
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "model": "llama3-8b-8192",
            "temperature": 0.3,
            "max_tokens": 1000,
            "top_p": 1,
            "stream": False
        }
        
        try:
            response = requests.post(self.groq_base_url, headers=headers, json=payload)
            response.raise_for_status()
            
            result = response.json()
            return result['choices'][0]['message']['content']
            
        except requests.exceptions.RequestException as e:
            return f"API Error: {str(e)}"
        except KeyError as e:
            return f"Response parsing error: {str(e)}"
        except Exception as e:
            return f"Unexpected error: {str(e)}"

    def detect_topic_and_subject_with_ai(self, question, doubt):
        """Use Llama to intelligently detect topic and subject"""
        headers = {
            'Authorization': f'Bearer {self.groq_api_key}',
            'Content-Type': 'application/json'
        }
        
        prompt = f"""Analyze the following academic question and student doubt to identify the subject and specific topics. Return your response as a JSON object with the exact structure shown below.

Question: {question}
Student's Doubt: {doubt}

You must respond with ONLY a valid JSON object in this exact format:
{{
    "subject": "one of: physics, chemistry, mathematics, biology, computer_science, economics, other",
    "main_topic": "specific topic name (e.g., 'mechanics', 'organic_chemistry', 'calculus', 'genetics')",
    "subtopics": ["list", "of", "2-4", "specific", "subtopic", "keywords"],
    "difficulty_level": "one of: basic, intermediate, advanced",
    "search_keywords": ["3-5", "key", "terms", "for", "youtube", "search"]
}}

Guidelines:
- Choose the most relevant subject from the provided options
- Be specific with main_topic (e.g., 'electromagnetic_induction' not just 'physics')
- Include 2-4 precise subtopics that would help in video search
- Generate 3-5 search keywords that would find relevant educational videos
- Consider both the question content and the student's specific doubt"""

        payload = {
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "model": "llama3-8b-8192",
            "temperature": 0.1,  # Low temperature for consistent JSON output
            "max_tokens": 300,
            "top_p": 1,
            "stream": False
        }
        
        try:
            response = requests.post(self.groq_base_url, headers=headers, json=payload)
            response.raise_for_status()
            
            result = response.json()
            ai_response = result['choices'][0]['message']['content'].strip()
            
            # Extract JSON from response (in case there's extra text)
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                ai_response = json_match.group()
            
            # Parse the JSON response
            topic_data = json.loads(ai_response)
            
            # Validate the response structure
            required_keys = ['subject', 'main_topic', 'subtopics', 'difficulty_level', 'search_keywords']
            if all(key in topic_data for key in required_keys):
                return topic_data
            else:
                print(f"Invalid AI response structure: {topic_data}")
                return self.fallback_topic_detection(question, doubt)
                
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}, Response: {ai_response}")
            return self.fallback_topic_detection(question, doubt)
        except requests.exceptions.RequestException as e:
            print(f"API Error in topic detection: {str(e)}")
            return self.fallback_topic_detection(question, doubt)
        except Exception as e:
            print(f"Unexpected error in AI topic detection: {str(e)}")
            return self.fallback_topic_detection(question, doubt)

    def fallback_topic_detection(self, question, doubt):
        """Fallback method using simple keyword matching"""
        combined_text = f"{question} {doubt}".lower()
        
        # Simple subject detection
        if any(word in combined_text for word in ['force', 'velocity', 'acceleration', 'energy', 'wave']):
            subject = 'physics'
        elif any(word in combined_text for word in ['molecule', 'atom', 'reaction', 'acid', 'base']):
            subject = 'chemistry'
        elif any(word in combined_text for word in ['equation', 'derivative', 'integral', 'function']):
            subject = 'mathematics'
        elif any(word in combined_text for word in ['cell', 'dna', 'organism', 'genetics']):
            subject = 'biology'
        else:
            subject = 'other'
        
        # Extract key terms for search
        words = re.findall(r'\b[a-zA-Z]+\b', combined_text)
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        keywords = [word for word in words if word not in stop_words and len(word) > 2]
        
        return {
            'subject': subject,
            'main_topic': f'{subject}_general',
            'subtopics': keywords[:4],
            'difficulty_level': 'intermediate',
            'search_keywords': keywords[:5]
        }

    def search_youtube_videos(self, question, doubt):
        """Search for relevant YouTube videos using AI-detected topics"""
        if not self.youtube_api_key:
            return []
            
        # Target channels
        target_channels = [
            'UC91RZv71f8p0VV2gaFI07pg',  # Channel 1
            'UCZNNx4KYmCkwxCLdsHyWqQA'   # Channel 2
        ]
        
        try:
            # Get AI-powered topic detection
            topic_data = self.detect_topic_and_subject_with_ai(question, doubt)
            
            subject = topic_data['subject']
            main_topic = topic_data['main_topic']
            subtopics = topic_data['subtopics']
            search_keywords = topic_data['search_keywords']
            
            # Create intelligent search queries based on AI analysis
            search_queries = []
            
            # Primary searches using AI-detected topics
            search_queries.extend([
                f"{main_topic} one shot",
                f"{main_topic} complete tutorial",
                f"{subject} {main_topic} oneshot"
            ])
            
            # Subtopic-specific searches
            for subtopic in subtopics[:2]:
                search_queries.extend([
                    f"{subtopic} one shot",
                    f"{subtopic} {subject} tutorial"
                ])
            
            # Keyword-based searches
            if len(search_keywords) >= 2:
                combined_keywords = ' '.join(search_keywords[:3])
                search_queries.extend([
                    f"{combined_keywords} one shot",
                    f"{combined_keywords} tutorial",
                    f"{combined_keywords} {subject}"
                ])
            
            # Remove duplicates while preserving order
            unique_queries = []
            seen = set()
            for query in search_queries:
                if query not in seen and len(query.strip()) > 0:
                    unique_queries.append(query)
                    seen.add(query)
            
            all_videos = []
            
            # Search each channel with AI-generated queries
            for channel_id in target_channels:
                for search_query in unique_queries[:5]:  # Limit to 5 queries per channel
                    try:
                        params = {
                            'part': 'snippet',
                            'q': search_query,
                            'type': 'video',
                            'channelId': channel_id,
                            'maxResults': 3,
                            'order': 'relevance',
                            'key': self.youtube_api_key,
                            'videoDuration': 'any',
                            'videoDefinition': 'any',
                            'safeSearch': 'strict',
                            'relevanceLanguage': 'en'
                        }
                        
                        response = requests.get(self.youtube_base_url, params=params, timeout=8)
                        response.raise_for_status()
                        
                        data = response.json()
                        
                        for item in data.get('items', []):
                            video = {
                                'id': item['id']['videoId'],
                                'title': item['snippet']['title'],
                                'description': item['snippet']['description'][:200] + '...' if len(item['snippet']['description']) > 200 else item['snippet']['description'],
                                'thumbnail': item['snippet']['thumbnails']['medium']['url'],
                                'channel': item['snippet']['channelTitle'],
                                'publishedAt': item['snippet']['publishedAt'],
                                'channelId': channel_id,
                                'searchQuery': search_query,
                                'relevanceScore': self.calculate_ai_relevance_score(
                                    item['snippet']['title'], 
                                    question, 
                                    doubt, 
                                    topic_data
                                ),
                                'detectedSubject': subject,
                                'detectedTopic': main_topic,
                                'detectedSubtopics': subtopics
                            }
                            all_videos.append(video)
                    
                    except requests.exceptions.RequestException as e:
                        print(f"Error searching channel {channel_id} with query '{search_query}': {str(e)}")
                        continue
                    except Exception as e:
                        print(f"Unexpected error in video search: {str(e)}")
                        continue
            
            # If no videos found from specific channels, do a general search
            if not all_videos:
                print("No videos found in specified channels, trying general search...")
                return self.general_youtube_search_ai(question, doubt, topic_data)
            
            # Remove duplicates and sort by AI-enhanced relevance
            unique_videos = {}
            for video in all_videos:
                if video['id'] not in unique_videos:
                    unique_videos[video['id']] = video
                elif video['relevanceScore'] > unique_videos[video['id']]['relevanceScore']:
                    unique_videos[video['id']] = video
            
            # Sort by relevance score and return top 3
            sorted_videos = sorted(unique_videos.values(), key=lambda x: x['relevanceScore'], reverse=True)
            
            # Add ranking info with AI-detected context
            for i, video in enumerate(sorted_videos[:3]):
                video['rank'] = i + 1
                video['reason'] = f"AI detected: {video['detectedTopic']} in {video['detectedSubject']}"
                if video['detectedSubtopics']:
                    video['reason'] += f" - Topics: {', '.join(video['detectedSubtopics'][:2])}"
            
            return sorted_videos[:3]
            
        except Exception as e:
            print(f"YouTube search error: {str(e)}")
            return []

    def calculate_ai_relevance_score(self, video_title, question, doubt, topic_data):
        """Enhanced relevance scoring using AI-detected topics"""
        title_lower = video_title.lower()
        question_lower = question.lower()
        doubt_lower = doubt.lower()
        
        score = 0
        
        # Base text matching score
        question_words = set(re.findall(r'\b[a-zA-Z]+\b', question_lower))
        doubt_words = set(re.findall(r'\b[a-zA-Z]+\b', doubt_lower))
        title_words = set(re.findall(r'\b[a-zA-Z]+\b', title_lower))
        
        question_overlap = len(question_words.intersection(title_words))
        doubt_overlap = len(doubt_words.intersection(title_words))
        
        score += question_overlap * 2
        score += doubt_overlap * 1.5
        
        # AI-detected topic matching (higher weight)
        subject = topic_data.get('subject', '').lower()
        main_topic = topic_data.get('main_topic', '').lower()
        subtopics = [t.lower() for t in topic_data.get('subtopics', [])]
        search_keywords = [k.lower() for k in topic_data.get('search_keywords', [])]
        
        # Subject match
        if subject in title_lower:
            score += 5
        
        # Main topic match
        for word in main_topic.split('_'):
            if word in title_lower:
                score += 4
        
        # Subtopic matches
        for subtopic in subtopics:
            if subtopic in title_lower:
                score += 3
        
        # Search keyword matches
        for keyword in search_keywords:
            if keyword in title_lower:
                score += 2
        
        # Educational content indicators
        educational_keywords = ['one shot', 'oneshot', 'complete', 'full', 'tutorial', 'explanation', 'concept', 'tricks', 'tips']
        for keyword in educational_keywords:
            if keyword in title_lower:
                score += 3
        
        # JEE/competitive exam keywords
        jee_keywords = ['jee', 'neet', 'iit', 'competitive', 'exam', 'entrance']
        for keyword in jee_keywords:
            if keyword in title_lower:
                score += 2
        
        # Difficulty level matching bonus
        difficulty = topic_data.get('difficulty_level', 'intermediate').lower()
        if difficulty in title_lower:
            score += 1
        
        return score

    def general_youtube_search_ai(self, question, doubt, topic_data):
        """Fallback general search using AI-detected topics"""
        try:
            search_keywords = topic_data.get('search_keywords', [])
            subject = topic_data.get('subject', '')
            main_topic = topic_data.get('main_topic', '')
            
            # Create search query from AI analysis
            if search_keywords:
                search_query = f"{' '.join(search_keywords[:3])} {subject} one shot tutorial"
            else:
                search_query = f"{main_topic} {subject} tutorial"
            
            params = {
                'part': 'snippet',
                'q': search_query,
                'type': 'video',
                'maxResults': 3,
                'order': 'relevance',
                'key': self.youtube_api_key,
                'videoDuration': 'medium',
                'videoDefinition': 'any',
                'safeSearch': 'strict'
            }
            
            response = requests.get(self.youtube_base_url, params=params, timeout=8)
            response.raise_for_status()
            
            data = response.json()
            videos = []
            
            for item in data.get('items', []):
                video = {
                    'id': item['id']['videoId'],
                    'title': item['snippet']['title'],
                    'description': item['snippet']['description'][:200] + '...' if len(item['snippet']['description']) > 200 else item['snippet']['description'],
                    'thumbnail': item['snippet']['thumbnails']['medium']['url'],
                    'channel': item['snippet']['channelTitle'],
                    'publishedAt': item['snippet']['publishedAt'],
                    'relevanceScore': self.calculate_ai_relevance_score(
                        item['snippet']['title'], 
                        question, 
                        doubt, 
                        topic_data
                    ),
                    'isGeneral': True,
                    'detectedSubject': subject,
                    'detectedTopic': main_topic
                }
                videos.append(video)
            
            return videos
            
        except Exception as e:
            print(f"General YouTube search error: {str(e)}")
            return []

    def get_topic_analysis_for_response(self, question, doubt):
        """Get a human-readable topic analysis for the API response"""
        try:
            topic_data = self.detect_topic_and_subject_with_ai(question, doubt)
            
            analysis = {
                'subject': topic_data.get('subject', 'unknown'),
                'main_topic': topic_data.get('main_topic', 'general'),
                'subtopics': topic_data.get('subtopics', []),
                'difficulty_level': topic_data.get('difficulty_level', 'intermediate'),
                'confidence': 'high' if topic_data.get('subject') != 'other' else 'medium'
            }
            
            return analysis
            
        except Exception as e:
            print(f"Error in topic analysis: {str(e)}")
            return {
                'subject': 'unknown',
                'main_topic': 'general',
                'subtopics': [],
                'difficulty_level': 'intermediate',
                'confidence': 'low'
            }

solver = QuestionSolver()

@app.route('/solve', methods=['POST'])
def solve_question():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
            
        question = data.get('question', '').strip()
        doubt = data.get('doubt', '').strip()
        
        if not question:
            return jsonify({'error': 'Question is required'}), 400
            
        if not doubt:
            return jsonify({'error': 'Doubt is required'}), 400
            
        # Get AI-powered topic analysis
        topic_analysis = solver.get_topic_analysis_for_response(question, doubt)
        
        # Get solution from Groq
        solution = solver.solve_question(question, doubt)
        
        # Get relevant YouTube videos using AI-detected topics
        videos = solver.search_youtube_videos(question, doubt)
        
        return jsonify({
            'success': True,
            'solution': solution,
            'question': question,
            'doubt': doubt,
            'videos': videos,
            'topic_analysis': topic_analysis  # Include AI analysis in response
        })
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/analyze-topic', methods=['POST'])
def analyze_topic():
    """Endpoint to just analyze topic without solving the question"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
            
        question = data.get('question', '').strip()
        doubt = data.get('doubt', '').strip()
        
        if not question:
            return jsonify({'error': 'Question is required'}), 400
            
        # Get detailed topic analysis
        topic_data = solver.detect_topic_and_subject_with_ai(question, doubt)
        
        return jsonify({
            'success': True,
            'topic_analysis': topic_data,
            'question': question,
            'doubt': doubt
        })
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    if not os.getenv('GROQ_API_KEY'):
        print("Warning: GROQ_API_KEY environment variable not set")
    if not os.getenv('YOUTUBE_API_KEY'):
        print("Warning: YOUTUBE_API_KEY environment variable not set")
    
    print("Required environment variables:")
    print("- GROQ_API_KEY: Set your Groq API key")
    print("- YOUTUBE_API_KEY: Set your Google YouTube Data API v3 key")
    print("\nNew Features:")
    print("- AI-powered topic detection using Llama")
    print("- Enhanced relevance scoring based on AI analysis")
    print("- New /analyze-topic endpoint for topic analysis only")
    
    app.run(debug=True, host='0.0.0.0', port=3002)