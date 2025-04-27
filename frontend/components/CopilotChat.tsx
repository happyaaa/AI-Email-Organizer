import React from 'react';

export const CopilotChat: React.FC = () => {
  React.useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdn.botframework.com/botframework-webchat/latest/webchat.js";
    document.head.appendChild(script);

    script.onload = () => {
      window.WebChat.renderWebChat({
        directLine: window.WebChat.createDirectLine({
          token: process.env.NEXT_PUBLIC_COPILOT_TOKEN
        }),
        styleOptions: {
          backgroundColor: '#f9fafb',
          botAvatarInitials: 'AI',
          accent: '#0078d4'
        }
      }, document.getElementById('copilot-chat'));
    };
  }, []);

  return (
    <div 
      id="copilot-chat" 
      className="fixed bottom-4 right-4 w-96 h-[600px] shadow-lg rounded-lg bg-white"
    />
  );
};