import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Link } from 'react-router-dom';

interface Question {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  tags: string[];
  upvotes: number;
  downvotes: number;
  views: number;
  answersCount: number;
}

const QuestionList = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'questions'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const questionData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Question[];
      setQuestions(questionData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching questions:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <div
          key={question.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <Link
            to={`/community/questions/${question.id}`}
            className="block space-y-3"
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
              {question.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 line-clamp-2">
              {question.content.replace(/<[^>]*>/g, '')}
            </p>
            <div className="flex flex-wrap gap-2">
              {question.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                <span>{question.views} views</span>
                <span>{question.upvotes - question.downvotes} votes</span>
                <span>{question.answersCount} answers</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>Asked by {question.authorName}</span>
                <span>•</span>
                <span>{new Date(question.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default QuestionList;