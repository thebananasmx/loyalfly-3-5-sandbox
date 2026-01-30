import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPublishedBlogPosts } from '../services/firebaseService';
import type { BlogPost } from '../types';

const BlogPage: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = 'Blog | Loyalfly';
        const fetchPosts = async () => {
            try {
                const blogPosts = await getPublishedBlogPosts();
                setPosts(blogPosts);
            } catch (error) {
                console.error("Failed to fetch blog posts:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    return (
        <div className="py-16 sm:py-24 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-black tracking-tight">Blog de Loyalfly</h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
                        Consejos, estrategias y noticias para ayudarte a fidelizar a tus clientes y hacer crecer tu negocio.
                    </p>
                </div>

                <div className="mt-16 max-w-4xl mx-auto">
                    {loading ? (
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-black"></div>
                        </div>
                    ) : posts.length > 0 ? (
                        <div className="grid gap-12">
                            {posts.map(post => (
                                <div key={post.id} className="grid md:grid-cols-3 gap-8 items-center">
                                    <div className="md:col-span-1">
                                        <Link to={`/blog/${post.slug}`}>
                                            <img src={post.imageUrl} alt={post.title} className="rounded-lg shadow-md aspect-video w-full object-cover hover:opacity-90 transition-opacity" />
                                        </Link>
                                    </div>
                                    <div className="md:col-span-2">
                                        <h2 className="text-2xl font-bold text-black tracking-tight">
                                            <Link to={`/blog/${post.slug}`} className="hover:text-[#4D17FF] transition-colors">{post.title}</Link>
                                        </h2>
                                        <p className="mt-3 text-base text-gray-600">{post.excerpt}</p>
                                        <div className="mt-4">
                                            <Link to={`/blog/${post.slug}`} className="text-base font-semibold text-[#4D17FF] hover:underline">
                                                Leer más &rarr;
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500">No hay artículos en el blog por el momento.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BlogPage;
