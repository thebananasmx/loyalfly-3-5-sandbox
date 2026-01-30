import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBlogPostBySlug } from '../services/firebaseService';
import type { BlogPost } from '../types';

const BlogPostPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchPost = async () => {
            if (!slug) {
                setError(true);
                setLoading(false);
                return;
            }
            try {
                const blogPost = await getBlogPostBySlug(slug);
                if (blogPost && blogPost.status === 'published') {
                    setPost(blogPost);
                    document.title = `${blogPost.title} | Loyalfly Blog`;
                    const metaDesc = document.querySelector('meta[name="description"]');
                    if (metaDesc) {
                        metaDesc.setAttribute('content', blogPost.excerpt);
                    }
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error("Failed to fetch post:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
        
        // Cleanup meta description on component unmount
        return () => {
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                metaDesc.setAttribute('content', "Crea tu tarjeta de lealtad digital en minutos con Loyalfly. Fideliza a tus clientes, aumenta tus ventas y olvídate de las tarjetas de cartón. ¡Simple y efectivo!");
            }
        };

    }, [slug]);

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-black"></div>
            </div>
        );
    }
    
    if (error || !post) {
        return (
            <div className="text-center py-24">
                <h1 className="text-3xl font-bold text-black">Artículo no encontrado</h1>
                <p className="mt-4 text-gray-600">El artículo que buscas no existe o no está disponible.</p>
                <Link to="/blog" className="mt-6 inline-block px-6 py-2.5 text-base font-medium text-white bg-black rounded-md hover:bg-gray-800">
                    Volver al Blog
                </Link>
            </div>
        );
    }
    
    return (
        <article className="py-16 sm:py-24 bg-white">
            <div className="container mx-auto px-4 max-w-3xl">
                <div className="mb-8">
                    <Link to="/blog" className="text-base font-semibold text-[#4D17FF] hover:underline">
                        &larr; Volver al Blog
                    </Link>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight">{post.title}</h1>
                <p className="mt-4 text-lg text-gray-500">
                    Publicado el {new Date(post.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <img 
                    src={post.imageUrl} 
                    alt={post.title} 
                    className="mt-8 w-full aspect-video object-cover rounded-lg shadow-lg"
                />
                <div 
                    className="prose prose-lg max-w-none mt-12 text-gray-800 space-y-4"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />
            </div>
        </article>
    );
};

export default BlogPostPage;
