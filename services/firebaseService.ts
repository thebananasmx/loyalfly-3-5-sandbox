import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  addDoc,
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import type { Customer, Business, BlogPost } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyAnW9n-Ou53G1RmD0amMXJfQ_OadfefVug",
  authDomain: "loyalflyapp-3-5.firebaseapp.com",
  projectId: "loyalflyapp-3-5",
  storageBucket: "loyalflyapp-3-5.appspot.com",
  messagingSenderId: "110326324187",
  appId: "1:110326324187:web:6516c54fab30370bf825fe",
  measurementId: "G-Z4DE1F8NTK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- HELPERS ---

const slugify = (str: string) => {
  str = str.replace(/^\s+|\s+$/g, ''); // trim
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  const from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
  const to   = "aaaaeeeeiiiioooouuuunc------";
  for (let i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes

  return str;
};

const normalizeForSearch = (str: string) => {
    if (!str) return '';
    str = str.toLowerCase();
    const from = "àáäâèéëêìíïîòóöôùúüûñç";
    const to   = "aaaaeeeeiiiioooouuuunc";
    for (let i = 0, l = from.length; i < l; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }
    return str;
};


// --- AUTH FUNCTIONS ---

export const registerBusiness = async (email: string, password:string, businessName: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Generate a unique slug in the 'businessSlugs' collection
  let slug = slugify(businessName);
  let slugDoc = await getDoc(doc(db, "businessSlugs", slug));
  let counter = 1;
  while(slugDoc.exists()) {
    slug = `${slugify(businessName)}-${counter}`;
    slugDoc = await getDoc(doc(db, "businessSlugs", slug));
    counter++;
  }

  await setDoc(doc(db, "businessSlugs", slug), { businessId: user.uid });
  
  // Create the main business document
  await setDoc(doc(db, "businesses", user.uid), {
    name: businessName,
    email: user.email,
    slug: slug,
    plan: 'Gratis', // Default plan
    createdAt: serverTimestamp(),
  });

  // Create the card configuration in a subcollection
  const cardConfigRef = doc(db, "businesses", user.uid, "config", "card");
  await setDoc(cardConfigRef, {
    name: businessName,
    reward: 'Tu Recompensa',
    color: '#FEF3C7',
    textColorScheme: 'dark',
    logoUrl: ''
  });

  // --- ZAPIER TRIGGER ---
  // Create a document in a separate collection to trigger the Zapier automation
  // for the welcome email.
  try {
    const zapierTriggerCollectionRef = collection(db, "new_business_registrations");
    await addDoc(zapierTriggerCollectionRef, {
      email: user.email,
      businessName: businessName,
      registeredAt: serverTimestamp(),
    });
  } catch (error) {
    // Log the error but don't block the user registration process
    console.error("Zapier trigger failed:", error);
  }
  
  return { uid: user.uid, email: user.email };
};

export const loginWithEmail = async (email: string, pass: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return {
    uid: userCredential.user.uid,
    email: userCredential.user.email,
  };
};

export const logout = async () => {
  await signOut(auth);
};

export const onAuthUserChanged = (callback: (user: any) => void) => onAuthStateChanged(auth, callback);

export const sendPasswordReset = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

export const reauthenticateAndChangePassword = async (currentPassword: string, newPassword: string) => {
    const user = auth.currentUser;
    if (!user || !user.email) {
        throw new Error("No user is currently signed in.");
    }
    
    // Create a credential with the user's email and current password
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    
    // Re-authenticate the user
    await reauthenticateWithCredential(user, credential);
    
    // If re-authentication is successful, update the password
    await updatePassword(user, newPassword);
};


// --- FIRESTORE FUNCTIONS ---

export const getBusinessData = async (businessId: string): Promise<Business | null> => {
    const businessDocRef = doc(db, "businesses", businessId);
    const cardConfigRef = doc(db, "businesses", businessId, "config", "card");
    const surveyConfigRef = doc(db, "businesses", businessId, "config", "survey");
    const customersCol = collection(db, `businesses/${businessId}/customers`);

    const [businessSnap, cardConfigSnap, surveyConfigSnap, customerSnapshot] = await Promise.all([
        getDoc(businessDocRef),
        getDoc(cardConfigRef),
        getDoc(surveyConfigRef),
        getDocs(customersCol)
    ]);

    if (businessSnap.exists()) {
        const businessData = businessSnap.data();
        const cardSettings = cardConfigSnap.exists() ? cardConfigSnap.data() : null;
        const surveySettings = surveyConfigSnap.exists() ? surveyConfigSnap.data() : null;
        
        return {
            id: businessId,
            ...businessData,
            cardSettings: cardSettings,
            surveySettings: surveySettings,
            customerCount: customerSnapshot.size
        } as Business;
    } else {
        console.log("No such business document!");
        return null;
    }
}

export const getBusinessIdBySlug = async (slug: string): Promise<string | null> => {
    const slugDocRef = doc(db, "businessSlugs", slug);
    const slugDocSnap = await getDoc(slugDocRef);
    if (slugDocSnap.exists()) {
        return slugDocSnap.data().businessId;
    }
    return null;
}

export const getPublicCardSettings = async (businessId: string) => {
    const businessDocRef = doc(db, "businesses", businessId);
    const cardConfigRef = doc(db, "businesses", businessId, "config", "card");

    const [businessSnap, cardConfigSnap] = await Promise.all([
        getDoc(businessDocRef),
        getDoc(cardConfigRef)
    ]);

    if (cardConfigSnap.exists() && businessSnap.exists()) {
        const businessData = businessSnap.data();
        const cardData = cardConfigSnap.data();
        
        return {
            ...cardData,
            plan: businessData.plan || 'Gratis',
            // Ensure name uses card config name if available, else business name
            name: cardData.name || businessData.name
        };
    } else {
        console.log("No such card configuration or business!");
        return null;
    }
}

export const getCustomers = async (businessId: string, pageStartDoc: any = null): Promise<{ customers: Customer[], lastVisibleDoc: any | null }> => {
    const PAGE_SIZE = 25;
    const customersCol = collection(db, `businesses/${businessId}/customers`);
    
    const constraints: any[] = [orderBy("enrollmentDate", "desc"), limit(PAGE_SIZE)];
    if (pageStartDoc) {
        constraints.push(startAfter(pageStartDoc));
    }

    const q = query(customersCol, ...constraints);
    const customerSnapshot = await getDocs(q);

    const customers = customerSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        enrollmentDate: (doc.data().enrollmentDate as Timestamp)?.toDate().toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
    } as Customer));

    const lastVisibleDoc = customerSnapshot.docs.length > 0 ? customerSnapshot.docs[customerSnapshot.docs.length - 1] : null;

    return { customers, lastVisibleDoc };
};

export const getAllCustomers = async (businessId: string): Promise<Customer[]> => {
    const customersCol = collection(db, `businesses/${businessId}/customers`);
    const customerSnapshot = await getDocs(customersCol);
    return customerSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        enrollmentDate: (doc.data().enrollmentDate as Timestamp)?.toDate().toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
    } as Customer));
};

export const searchCustomers = async (businessId: string, searchQuery: string): Promise<Customer[]> => {
    const customersCol = collection(db, `businesses/${businessId}/customers`);
    
    const normalizedNameQuery = normalizeForSearch(searchQuery);
    
    // Query for name prefix using the normalized `searchableName` field
    const nameQuery = query(
        customersCol,
        where('searchableName', '>=', normalizedNameQuery),
        where('searchableName', '<=', normalizedNameQuery + '\uf8ff'),
        limit(15)
    );

    // Query for phone prefix (remains unchanged)
    const phoneQuery = query(
        customersCol,
        where('phone', '>=', searchQuery),
        where('phone', '<=', searchQuery + '\uf8ff'),
        limit(15)
    );

    // Query for email prefix
    const emailQuery = query(
        customersCol,
        where('email', '>=', searchQuery),
        where('email', '<=', searchQuery + '\uf8ff'),
        limit(15)
    );

    const [nameSnapshot, phoneSnapshot, emailSnapshot] = await Promise.all([
        getDocs(nameQuery),
        getDocs(phoneQuery),
        getDocs(emailQuery)
    ]);

    const customersMap = new Map<string, Customer>();

    const processSnapshot = (snapshot: any) => {
        snapshot.docs.forEach((doc: any) => {
            if (!customersMap.has(doc.id)) {
                customersMap.set(doc.id, {
                    id: doc.id,
                    ...doc.data(),
                    enrollmentDate: (doc.data().enrollmentDate as Timestamp)?.toDate().toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
                } as Customer);
            }
        });
    };

    processSnapshot(nameSnapshot);
    processSnapshot(phoneSnapshot);
    processSnapshot(emailSnapshot);

    return Array.from(customersMap.values());
};

export const updateCardSettings = async (businessId: string, settings: { name: string; reward: string; color: string; textColorScheme: string; logoUrl?: string; }) => {
    const cardConfigRef = doc(db, "businesses", businessId, "config", "card");
    await setDoc(cardConfigRef, settings, { merge: true });
    return { success: true, settings };
};

export const getCustomerByPhone = async (businessId: string, phone: string): Promise<Customer | null> => {
    const customersCol = collection(db, `businesses/${businessId}/customers`);
    const q = query(customersCol, where("phone", "==", phone));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    } else {
        const docSnap = querySnapshot.docs[0];
        return { 
            id: docSnap.id, 
            ...docSnap.data(),
            enrollmentDate: (docSnap.data().enrollmentDate as Timestamp)?.toDate().toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
        } as Customer;
    }
};

export const addStampToCustomer = async (businessId: string, customerId: string, quantity: number = 1): Promise<Customer> => {
    const customerDocRef = doc(db, `businesses/${businessId}/customers`, customerId);
    const customerSnap = await getDoc(customerDocRef);
    if (customerSnap.exists()) {
        const currentStamps = customerSnap.data().stamps || 0;
        await updateDoc(customerDocRef, {
            stamps: currentStamps + quantity
        });
        const updatedSnap = await getDoc(customerDocRef);
        return { 
            id: updatedSnap.id, 
            ...updatedSnap.data(),
            enrollmentDate: (updatedSnap.data().enrollmentDate as Timestamp)?.toDate().toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
        } as Customer;
    } else {
        throw new Error("Customer not found");
    }
};

export const redeemRewardForCustomer = async (businessId: string, customerId: string): Promise<Customer> => {
    const customerDocRef = doc(db, `businesses/${businessId}/customers`, customerId);
    const customerSnap = await getDoc(customerDocRef);
    if (customerSnap.exists()) {
        const currentStamps = customerSnap.data().stamps || 0;
        const currentRewards = customerSnap.data().rewardsRedeemed || 0;

        if (currentStamps < 10) {
            throw new Error("Customer does not have enough stamps for a reward.");
        }

        await updateDoc(customerDocRef, {
            stamps: currentStamps - 10,
            rewardsRedeemed: currentRewards + 1
        });

        const updatedSnap = await getDoc(customerDocRef);
        return { 
            id: updatedSnap.id, 
            ...updatedSnap.data(),
            enrollmentDate: (updatedSnap.data().enrollmentDate as Timestamp)?.toDate().toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
        } as Customer;
    } else {
        throw new Error("Customer not found");
    }
};

const PLAN_LIMITS = {
    Gratis: 100,
    Entrepreneur: 1000,
};

export const createNewCustomer = async (businessId: string, data: { name: string, phone: string, email: string }): Promise<Customer> => {
    const businessData = await getBusinessData(businessId);
    if (!businessData) {
        throw new Error("Business not found");
    }

    const { plan, customerCount } = businessData;
    
    if (plan === 'Gratis' && customerCount >= PLAN_LIMITS.Gratis) {
        throw new Error("LIMIT_REACHED");
    }
    if (plan === 'Entrepreneur' && customerCount >= PLAN_LIMITS.Entrepreneur) {
        throw new Error("LIMIT_REACHED");
    }

    const customersCol = collection(db, `businesses/${businessId}/customers`);
    const newCustomerData = {
        ...data,
        searchableName: normalizeForSearch(data.name),
        enrollmentDate: serverTimestamp(),
        stamps: 0,
        rewardsRedeemed: 0,
    };
    const docRef = await addDoc(customersCol, newCustomerData);
    return {
        id: docRef.id,
        ...data,
        enrollmentDate: new Date().toISOString().split('T')[0],
        stamps: 0,
        rewardsRedeemed: 0,
    };
};

export const getCustomerById = async (businessId: string, customerId: string): Promise<Customer | null> => {
    const customerDocRef = doc(db, `businesses/${businessId}/customers`, customerId);
    const docSnap = await getDoc(customerDocRef);
    if (docSnap.exists()) {
        return { 
            id: docSnap.id, 
            ...docSnap.data(),
            enrollmentDate: (docSnap.data().enrollmentDate as Timestamp)?.toDate().toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
        } as Customer;
    }
    return null;
};

export const updateCustomer = async (businessId: string, customerId: string, data: { name: string, phone: string, email: string }): Promise<void> => {
    const customerDocRef = doc(db, `businesses/${businessId}/customers`, customerId);
    const dataToUpdate: any = { ...data };
    if (data.name) {
        dataToUpdate.searchableName = normalizeForSearch(data.name);
    }
    await updateDoc(customerDocRef, dataToUpdate);
};

export const deleteCustomer = async (businessId: string, customerId: string): Promise<void> => {
    const customerDocRef = doc(db, `businesses/${businessId}/customers`, customerId);
    await deleteDoc(customerDocRef);
};

// --- SUPER ADMIN AUTH & HELPERS ---

export const isSuperAdmin = async (userId: string): Promise<boolean> => {
    if (!userId) return false;
    const adminDocRef = doc(db, "super_admins", userId);
    const adminDocSnap = await getDoc(adminDocRef);
    return adminDocSnap.exists();
};

export const registerSuperAdmin = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await setDoc(doc(db, "super_admins", user.uid), {
        email: user.email,
        registeredAt: serverTimestamp(),
    });
    return { uid: user.uid, email: user.email };
};

// --- SUPER ADMIN FUNCTIONS ---

export interface BusinessAdminData {
  id: string;
  name: string;
  email: string;
  plan?: 'Gratis' | 'Entrepreneur' | 'Pro';
  customerCount: number;
  totalStamps: number;
  totalRewards: number;
  createdAt?: string; // Formatted date for display
  rawCreatedAt?: number; // Timestamp for sorting
  customerEnrollmentDates?: number[]; // Array of customer enrollment timestamps
}

export const getAllBusinessesForSuperAdmin = async (): Promise<BusinessAdminData[]> => {
    const businessCol = collection(db, "businesses");
    const businessSnapshot = await getDocs(businessCol);
    const businesses = businessSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const businessesWithData = await Promise.all(
        businesses.map(async (business) => {
            const customersCol = collection(db, `businesses/${business.id}/customers`);
            const customerSnapshot = await getDocs(customersCol);
            
            let totalStamps = 0;
            let totalRewards = 0;
            const customerEnrollmentDates: number[] = [];

            customerSnapshot.docs.forEach(doc => {
                const data = doc.data();
                totalStamps += data.stamps || 0;
                totalRewards += data.rewardsRedeemed || 0;
                
                const enrollDate = data.enrollmentDate;
                if (enrollDate instanceof Timestamp) {
                    customerEnrollmentDates.push(enrollDate.toMillis());
                } else if (enrollDate) {
                    customerEnrollmentDates.push(new Date(enrollDate).getTime());
                }
            });

            const rawCreatedAt = (business as any).createdAt;
            const dateObj = rawCreatedAt instanceof Timestamp ? rawCreatedAt.toDate() : (rawCreatedAt ? new Date(rawCreatedAt) : null);

            return {
                id: business.id,
                name: (business as any).name as string,
                email: (business as any).email as string,
                plan: ((business as any).plan as 'Gratis' | 'Entrepreneur' | 'Pro') || 'Gratis',
                customerCount: customerSnapshot.size,
                totalStamps,
                totalRewards,
                createdAt: dateObj ? dateObj.toISOString().split('T')[0] : '-',
                rawCreatedAt: dateObj ? dateObj.getTime() : 0,
                customerEnrollmentDates
            };
        })
    );
    
    return businessesWithData;
};

// Function for Landing Page - Aggregate Stats (Read-Only)
export const getGlobalStats = async (): Promise<{ totalBusinesses: number; totalStamps: number; totalRewards: number }> => {
    const businessCol = collection(db, "businesses");
    const businessSnapshot = await getDocs(businessCol);
    const businesses = businessSnapshot.docs.map(doc => doc.id);

    let totalStamps = 0;
    let totalRewards = 0;

    // Use Promise.all to fetch customer collections in parallel
    // Note: In a production environment with thousands of businesses, this should be a cached cloud function.
    // For MVP, this client-side aggregation is acceptable.
    await Promise.all(
        businesses.map(async (businessId) => {
            const customersCol = collection(db, `businesses/${businessId}/customers`);
            const customerSnapshot = await getDocs(customersCol);
            
            customerSnapshot.docs.forEach(doc => {
                const data = doc.data();
                totalStamps += data.stamps || 0;
                totalRewards += data.rewardsRedeemed || 0;
            });
        })
    );

    return {
        totalBusinesses: businesses.length,
        totalStamps,
        totalRewards
    };
};

export const updateBusinessPlan = async (businessId: string, plan: 'Gratis' | 'Entrepreneur' | 'Pro') => {
    const businessDocRef = doc(db, "businesses", businessId);
    await updateDoc(businessDocRef, { plan });
};

export const deleteBusinessForSuperAdmin = async (businessId: string): Promise<void> => {
    const businessDocRef = doc(db, "businesses", businessId);
    const businessSnap = await getDoc(businessDocRef);
    if (!businessSnap.exists()) throw new Error("Business not found");
    const slug = businessSnap.data().slug;

    // Delete subcollections
    const customerCol = collection(db, `businesses/${businessId}/customers`);
    const customerSnapshot = await getDocs(customerCol);
    await Promise.all(customerSnapshot.docs.map(d => deleteDoc(d.ref)));

    const configCol = collection(db, `businesses/${businessId}/config`);
    const configSnapshot = await getDocs(configCol);
    await Promise.all(configSnapshot.docs.map(d => deleteDoc(d.ref)));

    const surveyResponsesCol = collection(db, `businesses/${businessId}/surveyResponses`);
    const surveyResponsesSnapshot = await getDocs(surveyResponsesCol);
    await Promise.all(surveyResponsesSnapshot.docs.map(d => deleteDoc(d.ref)));

    // Delete main doc and slug doc
    await deleteDoc(businessDocRef);
    if (slug) {
        const slugDocRef = doc(db, "businessSlugs", slug);
        await deleteDoc(slugDocRef);
    }
};

// --- SURVEY FUNCTIONS ---

export const getSurveySettings = async (businessId: string) => {
    const surveyConfigRef = doc(db, "businesses", businessId, "config", "survey");
    const surveyConfigSnap = await getDoc(surveyConfigRef);

    if (surveyConfigSnap.exists()) {
        return surveyConfigSnap.data();
    } else {
        return null;
    }
};

export const updateSurveySettings = async (businessId: string, settings: any) => {
    const surveyConfigRef = doc(db, "businesses", businessId, "config", "survey");
    await setDoc(surveyConfigRef, settings, { merge: true });
};

export const getSurveyResponses = async (businessId: string, surveyId: string) => {
    if (!surveyId) return [];
    const responsesCol = collection(db, `businesses/${businessId}/surveyResponses`);
    const q = query(responsesCol, where("surveyId", "==", surveyId));
    const responseSnapshot = await getDocs(q);
    return responseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const hasCustomerVoted = async (businessId: string, customerId: string, surveyId: string): Promise<boolean> => {
    if (!surveyId) return false;
    const responsesCol = collection(db, `businesses/${businessId}/surveyResponses`);
    const q = query(responsesCol, where("customerId", "==", customerId), where("surveyId", "==", surveyId), limit(1));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
};

export const submitSurveyResponse = async (businessId: string, customerId: string, customerName: string, response: string, surveyId: string): Promise<Customer> => {
    const alreadyVoted = await hasCustomerVoted(businessId, customerId, surveyId);
    if (alreadyVoted) {
        throw new Error("Customer has already voted on this survey.");
    }
    
    const responsesCol = collection(db, `businesses/${businessId}/surveyResponses`);
    await addDoc(responsesCol, {
        customerId,
        customerName,
        response,
        surveyId,
        createdAt: serverTimestamp(),
    });
    
    const updatedCustomer = await addStampToCustomer(businessId, customerId);
    return updatedCustomer;
};

// --- BLOG FUNCTIONS ---

export const createBlogPost = async (authorId: string, data: Omit<BlogPost, 'id' | 'createdAt' | 'slug'>): Promise<BlogPost> => {
    const blogPostsCol = collection(db, 'blogPosts');
    
    let slug = slugify(data.title);
    let slugDoc = await getDoc(doc(db, "blogSlugs", slug));
    let counter = 1;
    while(slugDoc.exists()) {
        slug = `${slugify(data.title)}-${counter}`;
        slugDoc = await getDoc(doc(db, "blogSlugs", slug));
        counter++;
    }

    const newPostData = {
        ...data,
        slug,
        authorId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(blogPostsCol, newPostData);
    
    await setDoc(doc(db, "blogSlugs", slug), { postId: docRef.id });

    return { ...newPostData, id: docRef.id, createdAt: new Date() } as BlogPost;
};

export const updateBlogPost = async (postId: string, data: Partial<Omit<BlogPost, 'id' | 'slug'>>): Promise<void> => {
    const postDocRef = doc(db, 'blogPosts', postId);
    await updateDoc(postDocRef, { ...data, updatedAt: serverTimestamp() });
};

export const deleteBlogPost = async (postId: string, slug: string): Promise<void> => {
    const postDocRef = doc(db, 'blogPosts', postId);
    const slugDocRef = doc(db, 'blogSlugs', slug);
    await deleteDoc(postDocRef);
    await deleteDoc(slugDocRef);
};

export const getPublishedBlogPosts = async (): Promise<BlogPost[]> => {
    const blogPostsCol = collection(db, 'blogPosts');
    // Query only by createdAt to avoid needing a composite index.
    const q = query(blogPostsCol, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const allPosts = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date()
    } as BlogPost));
    
    // Filter for published posts on the client side.
    return allPosts.filter(post => post.status === 'published');
};

export const getBlogPostBySlug = async (slug: string): Promise<BlogPost | null> => {
    const slugDocRef = doc(db, "blogSlugs", slug);
    const slugDocSnap = await getDoc(slugDocRef);

    if (slugDocSnap.exists()) {
        const postId = slugDocSnap.data().postId;
        const postDocRef = doc(db, 'blogPosts', postId);
        const postDocSnap = await getDoc(postDocRef);
        if (postDocSnap.exists()) {
            return { 
                id: postDocSnap.id, 
                ...postDocSnap.data(),
                createdAt: (postDocSnap.data().createdAt as Timestamp)?.toDate() || new Date()
            } as BlogPost;
        }
    }
    return null;
};

export const getAllBlogPostsForAdmin = async (): Promise<BlogPost[]> => {
    const blogPostsCol = collection(db, 'blogPosts');
    const q = query(blogPostsCol, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate().toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
    } as BlogPost));
};

export const getBlogPostById = async (postId: string): Promise<BlogPost | null> => {
    const postDocRef = doc(db, 'blogPosts', postId);
    const docSnap = await getDoc(postDocRef);
    if (docSnap.exists()) {
        return { 
            id: docSnap.id, 
            ...docSnap.data(),
            createdAt: (docSnap.data().createdAt as Timestamp)?.toDate() || new Date()
        } as BlogPost;
    }
    return null;
};

// --- METRICS FUNCTIONS ---

export interface BusinessMetrics {
  totalStamps: number;
  totalRewards: number;
  redemptionRate: number;
  newCustomersByMonth: { month: string; count: number }[];
  topCustomers: Customer[];
}

export const getBusinessMetrics = async (businessId: string): Promise<BusinessMetrics> => {
    const customers = await getAllCustomers(businessId);

    let totalStamps = 0;
    let totalRewards = 0;
    const customerGrowth: { [key: string]: number } = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    customers.forEach(customer => {
        totalStamps += customer.stamps || 0;
        totalRewards += customer.rewardsRedeemed || 0;
        
        const enrollmentDate = new Date(customer.enrollmentDate);
        if (enrollmentDate >= sixMonthsAgo) {
            const month = enrollmentDate.toLocaleString('es-MX', { month: 'long', year: '2-digit' });
            customerGrowth[month] = (customerGrowth[month] || 0) + 1;
        }
    });

    const redemptionRate = totalStamps > 0 ? (totalRewards * 10) / totalStamps * 100 : 0;

    // Format customer growth data for the chart
    const newCustomersByMonth = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return d.toLocaleString('es-MX', { month: 'long', year: '2-digit' });
    }).reverse().map(monthKey => ({
        month: monthKey.split(' de ')[0].charAt(0).toUpperCase() + monthKey.split(' de ')[0].slice(1),
        count: customerGrowth[monthKey] || 0
    }));


    const topCustomers = [...customers]
        .sort((a, b) => (b.stamps || 0) - (a.stamps || 0))
        .slice(0, 5);

    return {
        totalStamps,
        totalRewards,
        redemptionRate,
        newCustomersByMonth,
        topCustomers
    };
};