import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createBlogPost, updateBlogPost, getBlogPostById } from '../services/firebaseService';
import type { BlogPost } from '../types';

const ArrowLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;

const AdminBlogEditorPage: React.FC = () => {
    const { postId } = useParams<{ postId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();

    const [title, setTitle] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [content, setContent] = useState('');
    const [status, setStatus] = useState<'draft' | 'published'>('draft');

    const [loading, setLoading] = useState(!!postId);
    const [isSaving, setIsSaving] = useState(false);

    const isEditing = !!postId;

    useEffect(() => {
        document.title = isEditing ? 'Editar Post | Admin' : 'Nuevo Post | Admin';
        if (isEditing) {
            const fetchPost = async () => {
                try {
                    const postData = await getBlogPostById(postId);
                    if (postData) {
                        setTitle(postData.title);
                        setImageUrl(postData.imageUrl);
                        setExcerpt(postData.excerpt);
                        setContent(postData.content);
                        setStatus(postData.status);
                    } else {
                        showToast('Post no encontrado.', 'error');
                        navigate('/admin/blog');
                    }
                } catch (error) {
                    showToast('Error al cargar el post.', 'error');
                } finally {
                    setLoading(false);
                }
            };
            fetchPost();
        }
    }, [postId, isEditing, navigate, showToast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!title || !imageUrl || !excerpt || !content) {
            showToast('Todos los campos son requeridos.', 'alert');
            return;
        }

        setIsSaving(true);
        const postData: any = { title, imageUrl, excerpt, content, status };

        try {
            if (isEditing) {
                await updateBlogPost(postId, postData);
                showToast('Post actualizado con éxito.', 'success');
            } else {
                await createBlogPost(user.uid, postData);
                showToast('Post creado con éxito.', 'success');
            }
            navigate('/admin/blog');
        } catch (error) {
            showToast(`Error al guardar el post.`, 'error');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading) {
        return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-black"></div></div>;
    }

    const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black";

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link to="/admin/blog" className="p-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">
                    <ArrowLeftIcon />
                </Link>
                <h1 className="text-3xl font-bold text-black tracking-tight">
                    {isEditing ? 'Editar Post' : 'Crear Nuevo Post'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm space-y-6">
                 <div>
                    <label htmlFor="title" className="block text-base font-medium text-gray-700">Título del Post</label>
                    <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputClasses} required />
                </div>
                 <div>
                    <label htmlFor="imageUrl" className="block text-base font-medium text-gray-700">URL de la Imagen de Portada</label>
                    <input id="imageUrl" type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className={inputClasses} placeholder="https://ejemplo.com/imagen.png" required />
                </div>
                 <div>
                    <label htmlFor="excerpt" className="block text-base font-medium text-gray-700">Extracto (Resumen para SEO)</label>
                    <textarea id="excerpt" value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={3} className={inputClasses} maxLength={160} required />
                    <p className="text-sm text-gray-500 mt-1">{excerpt.length} / 160 caracteres</p>
                </div>
                <div>
                    <label htmlFor="content" className="block text-base font-medium text-gray-700">Contenido del Post</label>
                    <textarea id="content" value={content} onChange={e => setContent(e.target.value)} rows={15} className={`${inputClasses} font-mono`} required />
                    <p className="text-sm text-gray-500 mt-1">Puedes usar etiquetas HTML como &lt;h2&gt;, &lt;p&gt;, &lt;b&gt;, &lt;a href="..."&gt; para dar formato.</p>
                </div>
                <div>
                    <label htmlFor="status" className="block text-base font-medium text-gray-700">Estado</label>
                    <select id="status" value={status} onChange={e => setStatus(e.target.value as 'draft' | 'published')} className={inputClasses}>
                        <option value="draft">Borrador</option>
                        <option value="published">Publicado</option>
                    </select>
                </div>
                <div className="flex justify-end gap-4 pt-2">
                    <button type="button" onClick={() => navigate('/admin/blog')} className="px-4 py-2 text-base font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                        Cancelar
                    </button>
                    <button type="submit" disabled={isSaving} className="py-2 px-6 font-medium text-white bg-black rounded-md hover:bg-gray-800 disabled:bg-gray-400">
                        {isSaving ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Post')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminBlogEditorPage;
