import logging
import os
import json
import time
from flask import session

logger = logging.getLogger(__name__)

class SessionManager:
    """Utility for managing session-based result storage"""
    
    def __init__(self, max_results=30):
        """
        Initialize session manager
        
        Args:
            max_results: Maximum number of results to store in a session
        """
        self.max_results = max_results
        # self._ensure_session_results()
    
    def _ensure_session_results(self):
        """Ensure the results list exists in the session"""
        if 'results' not in session:
            session['results'] = []
    
    def add_result(self, result_data):
        """
        Add a new result to the session
        
        Args:
            result_data: Dictionary containing result data
        """
        self._ensure_session_results()
        
        # Add timestamp if not present
        if 'timestamp' not in result_data:
            result_data['timestamp'] = time.time()
        
        # Add to beginning of list (newest first)
        session['results'].insert(0, result_data)
        
        # Limit the number of stored results
        if len(session['results']) > self.max_results:
            session['results'] = session['results'][:self.max_results]
        
        # Save session
        session.modified = True
        
        logger.info(f"Added result {result_data.get('id')} to session, total results: {len(session['results'])}")
        
        return result_data
    
    def get_result(self, result_id):
        """
        Get a specific result by ID
        
        Args:
            result_id: ID of the result to retrieve
            
        Returns:
            dict or None: The result data if found, None otherwise
        """
        self._ensure_session_results()
        
        for result in session['results']:
            if result.get('id') == result_id:
                return result
        
        logger.warning(f"Result {result_id} not found in session")
        return None
    
    def get_all_results(self):
        """
        Get all results in the current session
        
        Returns:
            list: List of result dictionaries
        """
        self._ensure_session_results()
        return session['results']
    
    def clear_results(self):
        """Clear all results from the current session"""
        self._ensure_session_results()
        session['results'] = []
        session.modified = True
        logger.info("Cleared all results from session")
    
    def remove_result(self, result_id):
        """
        Remove a specific result by ID
        
        Args:
            result_id: ID of the result to remove
            
        Returns:
            bool: True if the result was removed, False otherwise
        """
        self._ensure_session_results()
        
        initial_count = len(session['results'])
        session['results'] = [r for r in session['results'] if r.get('id') != result_id]
        
        # Check if anything was removed
        removed = len(session['results']) < initial_count
        
        if removed:
            session.modified = True
            logger.info(f"Removed result {result_id} from session")
        else:
            logger.warning(f"Result {result_id} not found for removal")
        
        return removed
    
    def update_result(self, result_id, updated_data):
        """
        Update an existing result
        
        Args:
            result_id: ID of the result to update
            updated_data: New data to merge with existing result
            
        Returns:
            dict or None: Updated result if found, None otherwise
        """
        self._ensure_session_results()
        
        for i, result in enumerate(session['results']):
            if result.get('id') == result_id:
                # Update the result with new data
                result.update(updated_data)
                session['results'][i] = result
                session.modified = True
                logger.info(f"Updated result {result_id}")
                return result
        
        logger.warning(f"Result {result_id} not found for update")
        return None
    
    def filter_results_by_type(self, result_type):
        """
        Get results filtered by type
        
        Args:
            result_type: Type of results to filter for
            
        Returns:
            list: Filtered list of results
        """
        self._ensure_session_results()
        
        filtered_results = [r for r in session['results'] if r.get('type') == result_type]
        logger.info(f"Retrieved {len(filtered_results)} results of type {result_type}")
        
        return filtered_results
    
    def get_recent_results(self, count=5):
        """
        Get the most recent results
        
        Args:
            count: Number of recent results to retrieve
            
        Returns:
            list: List of recent results
        """
        self._ensure_session_results()
        
        recent = session['results'][:count]
        logger.info(f"Retrieved {len(recent)} recent results")
        
        return recent
    
    def has_results(self):
        """
        Check if there are any results in the session
        
        Returns:
            bool: True if there are results, False otherwise
        """
        self._ensure_session_results()
        return len(session['results']) > 0