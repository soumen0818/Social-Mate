export interface Story {
  id: string;
  user: string;
  avatar: string;
  hasStory: boolean;
  isOwn?: boolean;
}

export interface Post {
  id: string;
  user: { id: string; name: string; avatar: string; time: string };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  isBookmarked: boolean;
}

export interface Comment {
  id: string;
  user: { name: string; avatar: string; time: string };
  content: string;
  likes: number;
  hearts: number;
  replies: Comment[];
  image?: string;
}

export const MOCK_STORIES: Story[] = [
  { id: '0', user: 'Share Story', avatar: '', hasStory: false, isOwn: true },
  { id: '1', user: 'Liam', avatar: 'https://i.pravatar.cc/100?img=11', hasStory: true },
  { id: '2', user: 'Olivia', avatar: 'https://i.pravatar.cc/100?img=12', hasStory: true },
  { id: '3', user: 'Noah', avatar: 'https://i.pravatar.cc/100?img=13', hasStory: true },
  { id: '4', user: 'Emma', avatar: 'https://i.pravatar.cc/100?img=14', hasStory: true },
  { id: '5', user: 'Ava', avatar: 'https://i.pravatar.cc/100?img=15', hasStory: true },
];

export const MOCK_POSTS: Post[] = [
  {
    id: '1',
    user: { id: '2', name: 'Liam Hughes', avatar: 'https://i.pravatar.cc/100?img=33', time: '2 hours ago' },
    content: 'Just deployed my first full-stack application using Next.js and Supabase! The developer experience was incredible. Anyone else building with this stack? 🚀💻 #coding #webdev',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80',
    likes: 1964, comments: 135, isLiked: false, isBookmarked: false,
  },
  {
    id: '2',
    user: { id: '3', name: 'Olivia Martinez', avatar: 'https://i.pravatar.cc/100?img=24', time: '5 hours ago' },
    content: 'Completed a 15km hike at Yosemite National Park today. The views from the top were absolutely breathtaking. Nature is the best therapy! 🏞️🥾',
    image: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=600&q=80',
    likes: 842, comments: 67, isLiked: true, isBookmarked: false,
  },
  {
    id: '3',
    user: { id: '4', name: 'Noah Chen', avatar: 'https://i.pravatar.cc/100?img=68', time: 'Yesterday' },
    content: 'Just published my new UI/UX design case study evaluating modern mobile navigation patterns. I spent months compiling this research. Check it out and let me know your thoughts! 🎨✨',
    likes: 3219, comments: 284, isLiked: false, isBookmarked: true,
  },
];

export const MOCK_COMMENTS: Comment[] = [
  {
    id: '1',
    user: { name: 'Elias Thorne', avatar: 'https://i.pravatar.cc/100?img=33', time: '1 hour ago' },
    content: 'This is super inspiring! I have been meaning to try out Supabase as well. How did you handle the authentication flow?',
    likes: 22, hearts: 8,
    replies: [
      {
        id: '1-1',
        user: { name: 'Liam Hughes', avatar: 'https://i.pravatar.cc/100?img=44', time: '45 mins ago' },
        content: 'It was surprisingly straightforward! I used their built-in Auth UI helpers.',
        likes: 2, hearts: 0, replies: [],
      },
    ],
  },
  {
    id: '2',
    user: { name: 'Maya Patel', avatar: 'https://i.pravatar.cc/100?img=44', time: '2 hours ago' },
    content: 'Stunning photo! Which trail did you take? I am planning a trip there next month.',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80',
    likes: 5, hearts: 2, replies: [],
  },
  {
    id: '3',
    user: { name: 'Sarah Miller', avatar: 'https://i.pravatar.cc/100?img=25', time: '3 hours ago' },
    content: 'Great case study. The section on bottom navigation vs hamburger menus definitely gave me a new perspective.',
    likes: 12, hearts: 4, replies: [],
  },
];

export const MOCK_FRIENDS = [
  { id: '1', name: 'Sophia Chen', avatar: 'https://i.pravatar.cc/100?img=5', mutualFriends: 12, location: 'San Francisco, CA' },
  { id: '2', name: 'James Wilson', avatar: 'https://i.pravatar.cc/100?img=67', mutualFriends: 8, location: 'London, UK' },
  { id: '3', name: 'Priya Patel', avatar: 'https://i.pravatar.cc/100?img=10', mutualFriends: 5, location: 'Mumbai, India' },
  { id: '4', name: 'Carlos Rodriguez', avatar: 'https://i.pravatar.cc/100?img=56', mutualFriends: 3, location: 'Madrid, Spain' },
  { id: '5', name: 'Emma Thompson', avatar: 'https://i.pravatar.cc/100?img=23', mutualFriends: 15, location: 'Sydney, AU' },
  { id: '6', name: 'Ahmed Hassan', avatar: 'https://i.pravatar.cc/100?img=70', mutualFriends: 2, location: 'Cairo, Egypt' },
];

export const MOCK_GROUPS = [
  { id: '1', name: 'Frontend Masters', cover: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=200&q=80', members: 45200, isJoined: true, category: 'Tech' },
  { id: '2', name: 'React Native Devs', cover: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=200&q=80', members: 32100, isJoined: false, category: 'Technology' },
  { id: '3', name: 'Global Backpackers', cover: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=200&q=80', members: 18900, isJoined: true, category: 'Travel' },
  { id: '4', name: 'Indie Hackers', cover: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=200&q=80', members: 28000, isJoined: false, category: 'Business' },
  { id: '5', name: 'Photography Central', cover: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200&q=80', members: 61000, isJoined: false, category: 'Lifestyle' },
];

export const LIKE_AVATARS = [
  'https://i.pravatar.cc/40?img=1',
  'https://i.pravatar.cc/40?img=2',
  'https://i.pravatar.cc/40?img=3',
  'https://i.pravatar.cc/40?img=4',
  'https://i.pravatar.cc/40?img=5',
  'https://i.pravatar.cc/40?img=6',
];
