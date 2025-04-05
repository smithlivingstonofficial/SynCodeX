import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';

interface Answer {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
  upvotes: number;
  downvotes: number;
}

interface Question {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
  tags: string[];
  upvotes: number;
  downvotes: number;
  views: number;
  answersCount: number;
}

const QuestionDetail = () => {
  const { questionId } = useParams<{ questionId: string }>();
  const { user } = useAuth();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [newAnswer, setNewAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestion = async () => {
      if (!questionId) return;

      try {
        const questionDoc = await getDoc(doc(db, 'questions', questionId));
        if (questionDoc.exists()) {
          setQuestion({ id: questionDoc.id, ...questionDoc.data() } as Question);
          // Increment view count
          await updateDoc(doc(db, 'questions', questionId), {
            views: increment(1)
          });
        }
      } catch (error) {
        console.error('Error fetching question:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();

    // Subscribe to answers
    if (questionId) {
      const q = query(
        collection(db, `questions/${questionId}/answers`),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const answersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Answer[];
        setAnswers(answersData);
      });

      return () => unsubscribe();
    }
  }, [questionId]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnswer.trim() || !user || !questionId) return;

    setIsSubmitting(true);
    try {
      const answerData = {
        content: newAnswer.trim(),
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        createdAt: new Date().toISOString(),
        upvotes: 0,
        downvotes: 0
      };

      await addDoc(collection(db, `questions/${questionId}/answers`), answerData);
      await updateDoc(doc(db, 'questions', questionId), {
        answersCount: increment(1)
      });

      setNewAnswer('');
    } catch (error) {
      console.error('Error posting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Question not found
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Question */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{question.title}</h1>
        <div className="flex flex-wrap gap-2 mb-4">
          {question.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-6">{question.content}</p>
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>{question.views} views</span>
            <span>{question.upvotes - question.downvotes} votes</span>
            <span>{question.answersCount} answers</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Asked by {question.authorName}</span>
            <span>•</span>
            <span>{new Date(question.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{answers.length} Answers</h2>
        {answers.map((answer) => (
          <div key={answer.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-4">{answer.content}</p>
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                <span>{answer.upvotes - answer.downvotes} votes</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>Answered by {answer.authorName}</span>
                <span>•</span>
                <span>{new Date(answer.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Answer Form */}
      {user && (
        <form onSubmit={handleSubmitAnswer} className="space-y-4">
          <div>
            <label htmlFor="answer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Answer
            </label>
            <textarea
              id="answer"
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Write your answer here..."
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Posting...' : 'Post Answer'}
          </button>
        </form>
      )}
    </div>
  );
};

export default QuestionDetail;