import ImageWithText from './ImageWithText';

const ImageWithTextBlock = () => {
    const blocks = [
        {
            imageUrl: './block2.jpg', // Inline path (public folder)
            title: "Real-Time Attendance & Workforce Analytics",
            description:
                "Monitor daily attendance with live status tracking - see who's present (2), late (15), remote (5), on leave (1), or absent (4) out of 21 total employees. Track check-in/check-out times, break schedules, laptop states, and work modes (on-site/remote) all in real-time with comprehensive daily, weekly, and monthly views.",
            buttonText: "See Attendance Demo",
        },
        {
            imageUrl: './block1.jpg',
            title: "Comprehensive Team Management & Performance Tracking",
            description:
                "Manage your entire workforce with detailed employee profiles, project assignments, and workload distribution. Track individual performance scores, manage increments, and see who's working on what project. From developers like Luqman Khan (66 workload) to Ahmad Ali (75 workload), keep everyone organized and productive.",
            buttonText: "View Team Features",
            reverse: true,
        },
        {
            imageUrl: './block3.jpg',
            title: "Smart Project Management & Team Collaboration",
            description:
                "Organize projects by priority with color-coded status indicators (Free, Medium, Good, Overloaded). Track story points, manage developers across multiple projects, and get instant visibility into project health. See real project data like Contentia, Bnbyond, PatronWorks, and WhisperVoice all in one unified dashboard.",
            buttonText: "Start Free Trial",
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