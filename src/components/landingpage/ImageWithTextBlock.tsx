import React from 'react';
import ImageWithText from './ImageWithText';
import block1 from '../../assets/block1.png';
import block2 from '../../assets/block2.png';
import block3 from '../../assets/block3.png';
import block4 from '../../assets/block4.png';
import block5 from '../../assets/block5.png';

const ImageWithTextBlock = () => {

const blocks = [
  {
    imageUrl: block1, 
    title: "Real-Time Attendance & Workforce Analytics",
    description:
      "Monitor daily attendance with live status tracking - see who's present (2), late (15), remote (5), on leave (1), or absent (4) out of 21 total employees. Track check-in/check-out times, break schedules, laptop states, and work modes (on-site/remote) all in real-time with comprehensive daily, weekly, and monthly views.",
    buttonText: "See Attendance Demo",
  },
    {
    imageUrl: block2, 
    title: "Comprehensive Team Management & Performance Tracking",
    description:
      "Manage your entire workforce with detailed employee profiles, project assignments, and workload distribution. Track individual performance scores, manage increments, and see who's working on what project. From developers like Luqman Khan (66 workload) to Ahmad Ali (75 workload), keep everyone organized and productive.",
    buttonText: "View Team Features",
    reverse: true,
  },
  {
    imageUrl: block3, 
    title: "Smart Project Management & Team Collaboration",
    description:
      "Organize projects by priority with color-coded status indicators (Free, Medium, Good, Overloaded). Track story points, manage developers across multiple projects, and get instant visibility into project health. See real project data like Contentia, Bnbyond, PatronWorks, and WhisperVoice all in one unified dashboard.",
    buttonText: "Start Free Trial",
  },
  {
    imageUrl: block4, 
    title: "Comprehensive Holiday Management System",
    description:
      "Streamline holiday planning with an intuitive calendar interface. Add new holidays by name, select multiple dates with visual date picker, and manage company-wide holiday schedules for 2025 and beyond. Track selected dates (0) with easy reset and save functionality, ensuring your team stays informed about upcoming holidays and time-off periods.",
    buttonText: "Explore Holiday Features",
    reverse: true,
  },
  {
    imageUrl: block5, 
    title: "Advanced Daily Logs & Team Communication Hub",
    description:
      "Monitor team productivity with detailed daily logs and integrated Slack communication. Track individual employee progress  and others with monthly performance ratings. View detailed project updates, task completions, and team conversations - from Safe Ride App development to UI component creation - all with AI-powered analysis and seamless Slack integration.",
    buttonText: "View Daily Logs Demo",
    
  },
  

];
  return (
    <>
      {blocks.map((block, index) => (
        <ImageWithText
          key={index}
          imageUrl={block.imageUrl}
          title={block.title}
          description={block.description}
          buttonText={block.buttonText}
          reverse={block.reverse}
        />
      ))}
    </>
  );
};

export default ImageWithTextBlock;
