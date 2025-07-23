
// TaskBoardLayout.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useAuthStore } from '../lib/store';
import TaskBoard from './TaskBoard';
import TaskBoardAdmin from './TaskBoardAdmin';
import { supabase } from '../lib/supabase';

const TaskBoardLayout: React.FC = () => {
    const { id: projectId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { userProfile, loading: userLoading } = useUser();
    const authUser = useAuthStore((state) => state.user);
    const [userRole, setUserRole] = useState<string>('');
    const [devops, setDevops] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const handleSetSelectedTAB = (tab: string) => {
        if (tab === "Projects" || tab === "") {
            navigate('/tasks');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch user role
                if (userProfile?.role) {
                    setUserRole(userProfile.role);
                } else {
                    const userId = authUser?.id || localStorage.getItem('user_id');
                    if (userId) {
                        const { data, error } = await supabase
                            .from('users')
                            .select('role')
                            .eq('id', userId)
                            .single();

                        if (!error && data) {
                            setUserRole(data.role);
                        }
                    }
                }

                // Fetch project-specific devops and all users
                if (projectId) {
                    const { data: projectData, error: projectError } = await supabase
                        .from('projects')
                        .select('devops')
                        .eq('id', projectId)
                        .single();

                    if (!projectError && projectData?.devops && projectData.devops.length > 0) {
                        console.log('Project devops:', projectData.devops);
                        setDevops(projectData.devops);
                    } else {
                        // Fallback to all users if project devops is empty
                        const { data: usersData, error: usersError } = await supabase
                            .from('users')
                            .select('id, full_name')
                            .neq('role', 'admin')
                            .neq('role', 'superadmin');

                        if (!usersError && usersData) {
                            const formattedUsers = usersData.map(user => ({
                                id: user.id,
                                name: user.full_name,
                                full_name: user.full_name
                            }));
                            console.log('Formatted users:', formattedUsers);
                            setDevops(formattedUsers);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (!userLoading) {
            fetchData();
        }
    }, [userProfile, authUser, userLoading]);

    if (loading || userLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    // If user role is "client", render TaskBoardAdmin
    if (userRole === "client" || userRole === "product manager") {
        console.log('Passing devops to TaskBoardAdmin:', devops);
        return (
            <TaskBoardAdmin
                setSelectedTAB={handleSetSelectedTAB}
                selectedTAB=""
                ProjectId={projectId || ""}
                devopss={devops}
            />
        );
    }

    // For all other users, render TaskBoard
    return (
        <TaskBoard
            setSelectedTAB={handleSetSelectedTAB}
        />
    );
};

export default TaskBoardLayout;