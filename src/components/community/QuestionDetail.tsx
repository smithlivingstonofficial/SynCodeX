import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface Answer {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
  upvotes: number;
  downvotes: number;
  votes: string[];
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
  votes: string[];
  bookmarks: string[];
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

  const handleVoteQuestion = async (type: 'upvote' | 'downvote') => {
    if (!user || !questionId || !question) return;

    try {
      const questionRef = doc(db, 'questions', questionId);
      const userId = user.uid;
      const hasVoted = question.votes.includes(userId);

      if (hasVoted) {
        await updateDoc(questionRef, {
          votes: arrayRemove(userId),
          [type === 'upvote' ? 'upvotes' : 'downvotes']: increment(-1)
        });
      } else {
        await updateDoc(questionRef, {
          votes: arrayUnion(userId),
          [type === 'upvote' ? 'upvotes' : 'downvotes']: increment(1)
        });
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleVoteAnswer = async (answerId: string, type: 'upvote' | 'downvote') => {
    if (!user || !questionId) return;

    try {
      const answerRef = doc(db, `questions/${questionId}/answers`, answerId);
      const userId = user.uid;
      const answer = answers.find(a => a.id === answerId);
      if (!answer) return;

      const hasVoted = answer.votes.includes(userId);

      if (hasVoted) {
        await updateDoc(answerRef, {
          votes: arrayRemove(userId),
          [type === 'upvote' ? 'upvotes' : 'downvotes']: increment(-1)
        });
      } else {
        await updateDoc(answerRef, {
          votes: arrayUnion(userId),
          [type === 'upvote' ? 'upvotes' : 'downvotes']: increment(1)
        });
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleBookmark = async () => {
    if (!user || !questionId || !question) return;

    try {
      const questionRef = doc(db, 'questions', questionId);
      const userId = user.uid;
      const isBookmarked = question.bookmarks.includes(userId);

      await updateDoc(questionRef, {
        bookmarks: isBookmarked ? arrayRemove(userId) : arrayUnion(userId)
      });
    } catch (error) {
      console.error('Error bookmarking:', error);
    }
  };

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
        downvotes: 0,
        votes: []
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

  const isBookmarked = user && question.bookmarks?.includes(user.uid);
  const hasVoted = user && question.votes?.includes(user.uid);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Question */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{question.title}</h1>
          <button
            onClick={handleBookmark}
            className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${isBookmarked ? 'text-yellow-500' : 'text-gray-400'}`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark this question'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isBookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>

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

        <div className="prose dark:prose-invert max-w-none mb-6" dangerouslySetInnerHTML={{ __html: question.content }} />

        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleVoteQuestion('upvote')}
                className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${hasVoted && question.upvotes > 0 ? 'text-green-500' : ''}`}
                title="Upvote"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <span>{question.upvotes - question.downvotes}</span>
              <button
                onClick={() => handleVoteQuestion('downvote')}
                className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${hasVoted && question.downvotes > 0 ? 'text-red-500' : ''}`}
                title="Downvote"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <span>{question.views} views</span>
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
        {answers.map((answer) => {
          const hasVotedAnswer = user && answer.votes?.includes(user.uid);
          return (
            <div key={answer.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="prose dark:prose-invert max-w-none mb-4" dangerouslySetInnerHTML={{ __html: answer.content }} />
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleVoteAnswer(answer.id, 'upvote')}
                    className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${hasVotedAnswer && answer.upvotes > 0 ? 'text-green-500' : ''}`}
                    title="Upvote"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <span>{answer.upvotes - answer.downvotes}</span>
                  <button
                    onClick={() => handleVoteAnswer(answer.id, 'downvote')}
                    className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${hasVotedAnswer && answer.downvotes > 0 ? 'text-red-500' : ''}`}
                    title="Downvote"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <span>Answered by {answer.authorName}</span>
                  <span>•</span>
                  <span>{new Date(answer.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Answer Form */}
      {user && (
        <form onSubmit={handleSubmitAnswer} className="space-y-4">
          <div>
            <label htmlFor="answer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Answer
            </label>
            <ReactQuill
              value={newAnswer}
              onChange={setNewAnswer}
              className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
              theme="snow"
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, false] }],
                  ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
                  [{'list': 'ordered'}, {'list': 'bullet'}],
                  ['link', 'image'],
                  ['clean']
                ],
              }}
              formats={[
                'header',
                'bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block',
                'list', 'bullet',
                'link', 'image'
              ]}
              placeholder="Write your answer here..."
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