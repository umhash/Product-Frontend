import Chat from '@/components/Chat';
import Navigation from '@/components/Navigation';
import AuthCheck from '@/components/AuthCheck';

export default function ChatPage() {
  return (
    <AuthCheck>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        <Navigation currentPage="chat" />
        <Chat />
      </div>
    </AuthCheck>
  );
}

export const metadata = {
  title: 'AI Study Agent - StudyCopilot AI',
  description: 'Get intelligent guidance for your UK university journey with our advanced AI study agent.',
};
