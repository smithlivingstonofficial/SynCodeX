import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Link } from 'react-router-dom';

interface Question {
  id: string;
  title: string;
  description: string;
  tags: string[];
  authorId: string;
  createdAt: Timestamp;
  views: number;
  answers: any[];
}

const QuestionList = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const allQuestions: Question[] = [];
        const usersSnapshot = await getDocs(collection(db, 'communities'));

        for (const userDoc of usersSnapshot.docs) {
          const questionsRef = collection(db, 'communities', userDoc.id, 'questions');
          const questionsQuery = query(questionsRef, orderBy('createdAt', 'desc'));
          const questionsSnapshot = await getDocs(questionsQuery);

          questionsSnapshot.forEach((doc) => {
            allQuestions.push({
              id: doc.id,
              ...doc.data() as Omit<Question, 'id'>
            });
          });
        }

        setQuestions(allQuestions);
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError('Failed to load questions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500 dark:text-red-400">{error}</div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No questions found. Be the first to ask a question!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <Link
          key={question.id}
          to={`/community/question/${question.id}`}
          className="block p-4 bg-white dark:bg-gray-900 rounded-lg shadow hover:shadow-md transition-shadow duration-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {question.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
            {question.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {question.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <span className="mr-4">{question.answers?.length || 0} answers</span>
            <span>{question.views} views</span>
            <span className="ml-auto">
              {question.createdAt.toDate().toLocaleDateString()}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default QuestionList;