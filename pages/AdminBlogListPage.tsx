import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllBlogPostsForAdmin, deleteBlogPost } from '../services/firebaseService';
import type { BlogPost } from '../types';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';

const PostIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;

const AdminBlogListPage: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
    
    useEffect(() => {
        document.title = 'Gestionar Blog | Admin';
        const fetchPosts = async () => {
            try {
                const data = await getAllBlogPostsForAdmin();
                setPosts(data);
            } catch (error) {
                console.error("Failed to fetch posts:", error);
                showToast('No se pudieron cargar los posts.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, [showToast]);

    const handleOpenDeleteModal = (post: BlogPost) => {
        setSelectedPost(post);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedPost) return;
        try {
            await deleteBlogPost(selectedPost.id, selectedPost.slug);
            setPosts(prev => prev.filter(p => p.id !== selectedPost.id));
            showToast('Post eliminado con éxito.', 'success');
        } catch (error) {
            showToast('Error al eliminar el post.', 'error');
        } finally {
            setIsDeleteModalOpen(false);
            setSelectedPost(null);
        }
    };

    const renderTableBody = () => {
        if (loading) {
            return (
                <tr>
                    <td colSpan={4} className="text-center px-6 py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-black mx-auto"></div>
                    </td>
                </tr>
            );
        }
        if (posts.length === 0) {
            return (
                <tr>
                    <td colSpan={4} className="text-center px-6 py-12 text-gray-500">No hay posts creados.</td>
                </tr>
            );
        }
        return posts.map(post => (
            <tr key={post.id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-4 sm:px-6 font-medium text-gray-900">{post.title}</td>
                <td className="px-4 py-4 sm:px-6">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {post.status === 'published' ? 'Publicado' : 'Borrador'}
                    </span>
                </td>
                <td className="px-4 py-4 sm:px-6 hidden md:table-cell">{post.createdAt}</td>
                <td className="px-4 py-4 sm:px-6 text-right space-x-2">
                    <button onClick={() => navigate(`/admin/blog/editar/${post.id}`)} className="font-medium text-[#4D17FF] hover:underline">Editar</button>
                    <button onClick={() => handleOpenDeleteModal(post)} className="font-medium text-red-600 hover:underline">Eliminar</button>
                </td>
            </tr>
        ));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-black tracking-tight">Gestionar Blog</h1>
                <Link to="/admin/blog/nuevo" className="inline-flex items-center justify-center gap-2 px-4 py-2 text-base font-medium text-white bg-black rounded-md hover:bg-gray-800">
                    <PostIcon />
                    Nuevo Post
                </Link>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-base text-left text-gray-600">
                        <thead className="text-base text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th scope="col" className="px-4 py-3 sm:px-6">Título</th>
                                <th scope="col" className="px-4 py-3 sm:px-6">Estado</th>
                                <th scope="col" className="px-4 py-3 sm:px-6 hidden md:table-cell">Fecha</th>
                                <th scope="col" className="px-4 py-3 sm:px-6 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderTableBody()}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {selectedPost && (
                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="¿Eliminar Post?"
                    confirmText="Sí, eliminar permanentemente"
                >
                    <p>Estás a punto de eliminar permanentemente el post <strong>"{selectedPost.title}"</strong>.</p>
                    <p className="mt-2 font-bold text-red-600">Esta acción no se puede deshacer.</p>
                </ConfirmationModal>
            )}
        </div>
    );
};

export default AdminBlogListPage;
