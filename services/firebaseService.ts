
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import type { Customer, Business, BlogPost } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyCjw7oHwrRWTaAkPOUXlyHzePA5vfdBCBE",
  authDomain: "loyalflyapp-3-5-sandbox.firebaseapp.com",
  projectId: "loyalflyapp-3-5-sandbox",
  storageBucket: "loyalflyapp-3-5-sandbox.firebasestorage.app",
  messagingSenderId: "475685701287",
  appId: "1:475685701287:web:fa8c10cfede3ba20543d82"
};

// FIX: Initializing Firebase using Namespaced (v8) syntax to match environment expectations where named exports are missing.
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// --- HELPERS ---

const slugify = (str: string) => {
  if (!str) return '';
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

// FIX: Replaced modular auth functions with namespaced (v8) methods.
export const registerBusiness = async (email: string, password:string, businessName: string) => {
  const userCredential = await auth.createUserWithEmailAndPassword(email, password);
  const user = userCredential.user;
  if (!user) throw new Error("Registration failed");

  // Generate a unique slug in the 'businessSlugs' collection
  let slug = slugify(businessName);
  let slugDoc = await db.collection("businessSlugs").doc(slug).get();
  let counter = 1;
  while(slugDoc.exists) {
    slug = `${slugify(businessName)}-${counter}`;
    slugDoc = await db.collection("businessSlugs").doc(slug).get();
    counter++;
  }

  await db.collection("businessSlugs").doc(slug).set({ businessId: user.uid });
  
  // Create the main business document
  await db.collection("businesses").doc(user.uid).set({
    name: businessName,
    email: user.email,
    slug: slug,
    plan: 'Gratis', // Default plan
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  // Create the card configuration in a subcollection
  await db.collection("businesses").doc(user.uid).collection("config").doc("card").set({
    name: businessName,
    reward: 'Tu Recompensa',
    color: '#FEF3C7',
    textColorScheme: 'dark',
    logoUrl: ''
  });

  // --- ZAPIER TRIGGER ---
  try {
    await db.collection("new_business_registrations").add({
      email: user.email,
      businessName: businessName,
      registeredAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Zapier trigger failed:", error);
  }
  
  return { uid: user.uid, email: user.email };
};

export const loginWithEmail = async (email: string, pass: string) => {
  const userCredential = await auth.signInWithEmailAndPassword(email, pass);
  return {
    uid: userCredential.user?.uid,
    email: userCredential.user?.email,
  };
};

export const logout = async () => {
  await auth.signOut();
};

export const onAuthUserChanged = (callback: (user: any) => void) => auth.onAuthStateChanged(callback);

export const sendPasswordReset = async (email: string) => {
  await auth.sendPasswordResetEmail(email);
};

export const reauthenticateAndChangePassword = async (currentPassword: string, newPassword: string) => {
    const user = auth.currentUser;
    if (!user || !user.email) {
        throw new Error("No user is currently signed in.");
    }
    
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
    await user.reauthenticateWithCredential(credential);
    await user.updatePassword(newPassword);
};


// --- FIRESTORE FUNCTIONS ---

// FIX: Replaced modular Firestore functions (doc, setDoc, getDoc, etc.) with namespaced (v8) chainable methods.
export const getBusinessData = async (businessId: string): Promise<Business | null> => {
    const businessDocRef = db.collection("businesses").doc(businessId);
    const cardConfigRef = businessDocRef.collection("config").doc("card");
    const surveyConfigRef = businessDocRef.collection("config").doc("survey");
    const customersCol = businessDocRef.collection("customers");

    const [businessSnap, cardConfigSnap, surveyConfigSnap, customerSnapshot] = await Promise.all([
        businessDocRef.get(),
        cardConfigRef.get(),
        surveyConfigRef.get(),
        customersCol.get()
    ]);

    if (businessSnap.exists) {
        const businessData = businessSnap.data();
        const cardSettings = cardConfigSnap.exists ? cardConfigSnap.data() : null;
        const surveySettings = surveyConfigSnap.exists ? surveyConfigSnap.data() : null;
        
        return {
            id: businessId,
            ...businessData,
            cardSettings: cardSettings,
            surveySettings: surveySettings,
            customerCount: customerSnapshot.size
        } as Business;
    } else {
        return null;
    }
}

export const getBusinessIdBySlug = async (slug: string): Promise<string | null> => {
    const slugDocSnap = await db.collection("businessSlugs").doc(slug).get();
    if (slugDocSnap.exists) {
        return slugDocSnap.data()?.businessId;
    }
    return null;
}

export const getPublicCardSettings = async (businessId: string) => {
    const businessDocRef = db.collection("businesses").doc(businessId);
    const cardConfigRef = businessDocRef.collection("config").doc("card");

    const [businessSnap, cardConfigSnap] = await Promise.all([
        businessDocRef.get(),
        cardConfigRef.get()
    ]);

    if (cardConfigSnap.exists && businessSnap.exists) {
        const businessData = businessSnap.data() || {};
        const cardData = cardConfigSnap.data() || {};
        
        return {
            ...cardData,
            plan: businessData.plan || 'Gratis',
            name: cardData.name || businessData.name
        };
    } else {
        return null;
    }
}

export const getCustomers = async (businessId: string, pageStartDoc: any = null): Promise<{ customers: Customer[], lastVisibleDoc: any | null }> => {
    const PAGE_SIZE = 25;
    let q = db.collection("businesses").doc(businessId).collection("customers")
              .orderBy("enrollmentDate", "desc")
              .limit(PAGE_SIZE);
    
    if (pageStartDoc) {
        q = q.startAfter(pageStartDoc);
    }

    const customerSnapshot = await q.get();

    const customers = customerSnapshot.docs.map(doc => {
        const data = doc.data();
        const enrollmentDate = data.enrollmentDate;
        let formattedDate = new Date().toISOString().split('T')[0];
        
        // FIX: Ensure correct handling of Timestamp objects in the namespaced SDK.
        if (enrollmentDate instanceof firebase.firestore.Timestamp) {
            formattedDate = enrollmentDate.toDate().toISOString().split('T')[0];
        } else if (enrollmentDate && typeof enrollmentDate.toDate === 'function') {
             formattedDate = enrollmentDate.toDate().toISOString().split('T')[0];
        }

        return { 
            id: doc.id, 
            ...data,
            enrollmentDate: formattedDate
        } as Customer;
    });

    const lastVisibleDoc = customerSnapshot.docs.length > 0 ? customerSnapshot.docs[customerSnapshot.docs.length - 1] : null;

    return { customers, lastVisibleDoc };
};

export const getAllCustomers = async (businessId: string): Promise<Customer[]> => {
    const customerSnapshot = await db.collection("businesses").doc(businessId).collection("customers").get();
    return customerSnapshot.docs.map(doc => {
        const data = doc.data();
        const enrollmentDate = data.enrollmentDate;
        let formattedDate = new Date().toISOString().split('T')[0];
        
        if (enrollmentDate instanceof firebase.firestore.Timestamp) {
            formattedDate = enrollmentDate.toDate().toISOString().split('T')[0];
        }

        return { 
            id: doc.id, 
            ...data,
            enrollmentDate: formattedDate
        } as Customer;
    });
};

export const searchCustomers = async (businessId: string, searchQuery: string): Promise<Customer[]> => {
    const customersCol = db.collection("businesses").doc(businessId).collection("customers");
    const normalizedNameQuery = normalizeForSearch(searchQuery);
    
    // FIX: Using v8 chainable where and limit methods for multi-path search.
    const nameQuery = customersCol
        .where('searchableName', '>=', normalizedNameQuery)
        .where('searchableName', '<=', normalizedNameQuery + '\uf8ff')
        .limit(15);

    const phoneQuery = customersCol
        .where('phone', '>=', searchQuery)
        .where('phone', '<=', searchQuery + '\uf8ff')
        .limit(15);

    const emailQuery = customersCol
        .where('email', '>=', searchQuery)
        .where('email', '<=', searchQuery + '\uf8ff')
        .limit(15);

    const [nameSnapshot, phoneSnapshot, emailSnapshot] = await Promise.all([
        nameQuery.get(),
        phoneQuery.get(),
        emailQuery.get()
    ]);

    const customersMap = new Map<string, Customer>();

    const processSnapshot = (snapshot: firebase.firestore.QuerySnapshot) => {
        snapshot.docs.forEach((doc) => {
            if (!customersMap.has(doc.id)) {
                const data = doc.data();
                const enrollmentDate = data.enrollmentDate;
                let formattedDate = new Date().toISOString().split('T')[0];
                if (enrollmentDate instanceof firebase.firestore.Timestamp) {
                    formattedDate = enrollmentDate.toDate().toISOString().split('T')[0];
                }
                customersMap.set(doc.id, {
                    id: doc.id,
                    ...data,
                    enrollmentDate: formattedDate
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
    await db.collection("businesses").doc(businessId).collection("config").doc("card").set(settings, { merge: true });
    return { success: true, settings };
};

export const getCustomerByPhone = async (businessId: string, phone: string): Promise<Customer | null> => {
    const querySnapshot = await db.collection("businesses").doc(businessId).collection("customers")
        .where("phone", "==", phone)
        .get();

    if (querySnapshot.empty) {
        return null;
    } else {
        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data();
        const enrollmentDate = data.enrollmentDate;
        let formattedDate = new Date().toISOString().split('T')[0];
        if (enrollmentDate instanceof firebase.firestore.Timestamp) {
            formattedDate = enrollmentDate.toDate().toISOString().split('T')[0];
        }
        return { 
            id: docSnap.id, 
            ...data,
            enrollmentDate: formattedDate
        } as Customer;
    }
};

export const addStampToCustomer = async (businessId: string, customerId: string, quantity: number = 1): Promise<Customer> => {
    const customerDocRef = db.collection("businesses").doc(businessId).collection("customers").doc(customerId);
    const customerSnap = await customerDocRef.get();
    if (customerSnap.exists) {
        const currentStamps = customerSnap.data()?.stamps || 0;
        await customerDocRef.update({
            stamps: currentStamps + quantity
        });
        const updatedSnap = await customerDocRef.get();
        const data = updatedSnap.data() || {};
        const enrollmentDate = data.enrollmentDate;
        let formattedDate = new Date().toISOString().split('T')[0];
        if (enrollmentDate instanceof firebase.firestore.Timestamp) {
            formattedDate = enrollmentDate.toDate().toISOString().split('T')[0];
        }
        return { 
            id: updatedSnap.id, 
            ...data,
            enrollmentDate: formattedDate
        } as Customer;
    } else {
        throw new Error("Customer not found");
    }
};

export const redeemRewardForCustomer = async (businessId: string, customerId: string): Promise<Customer> => {
    const customerDocRef = db.collection("businesses").doc(businessId).collection("customers").doc(customerId);
    const customerSnap = await customerDocRef.get();
    if (customerSnap.exists) {
        const data = customerSnap.data() || {};
        const currentStamps = data.stamps || 0;
        const currentRewards = data.rewardsRedeemed || 0;

        if (currentStamps < 10) {
            throw new Error("Customer does not have enough stamps for a reward.");
        }

        await customerDocRef.update({
            stamps: currentStamps - 10,
            rewardsRedeemed: currentRewards + 1
        });

        const updatedSnap = await customerDocRef.get();
        const updatedData = updatedSnap.data() || {};
        const enrollmentDate = updatedData.enrollmentDate;
        let formattedDate = new Date().toISOString().split('T')[0];
        if (enrollmentDate instanceof firebase.firestore.Timestamp) {
            formattedDate = enrollmentDate.toDate().toISOString().split('T')[0];
        }
        return { 
            id: updatedSnap.id, 
            ...updatedData,
            enrollmentDate: formattedDate
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

    const newCustomerData = {
        ...data,
        searchableName: normalizeForSearch(data.name),
        enrollmentDate: firebase.firestore.FieldValue.serverTimestamp(),
        stamps: 0,
        rewardsRedeemed: 0,
    };
    const docRef = await db.collection("businesses").doc(businessId).collection("customers").add(newCustomerData);
    return {
        id: docRef.id,
        ...data,
        enrollmentDate: new Date().toISOString().split('T')[0],
        stamps: 0,
        rewardsRedeemed: 0,
    };
};

export const getCustomerById = async (businessId: string, customerId: string): Promise<Customer | null> => {
    const docSnap = await db.collection("businesses").doc(businessId).collection("customers").doc(customerId).get();
    if (docSnap.exists) {
        const data = docSnap.data() || {};
        const enrollmentDate = data.enrollmentDate;
        let formattedDate = new Date().toISOString().split('T')[0];
        if (enrollmentDate instanceof firebase.firestore.Timestamp) {
            formattedDate = enrollmentDate.toDate().toISOString().split('T')[0];
        }
        return { 
            id: docSnap.id, 
            ...data,
            enrollmentDate: formattedDate
        } as Customer;
    }
    return null;
};

export const updateCustomer = async (businessId: string, customerId: string, data: { name: string, phone: string, email: string }): Promise<void> => {
    const dataToUpdate: any = { ...data };
    if (data.name) {
        dataToUpdate.searchableName = normalizeForSearch(data.name);
    }
    await db.collection("businesses").doc(businessId).collection("customers").doc(customerId).update(dataToUpdate);
};

export const deleteCustomer = async (businessId: string, customerId: string): Promise<void> => {
    await db.collection("businesses").doc(businessId).collection("customers").doc(customerId).delete();
};

// --- SUPER ADMIN AUTH & HELPERS ---

export const isSuperAdmin = async (userId: string): Promise<boolean> => {
    if (!userId) return false;
    const adminDocSnap = await db.collection("super_admins").doc(userId).get();
    return adminDocSnap.exists;
};

export const registerSuperAdmin = async (email: string, password: string) => {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    if (!user) throw new Error("Admin registration failed");
    await db.collection("super_admins").doc(user.uid).set({
        email: user.email,
        registeredAt: firebase.firestore.FieldValue.serverTimestamp(),
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
    const businessSnapshot = await db.collection("businesses").get();
    const businesses = businessSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const businessesWithData = await Promise.all(
        businesses.map(async (business) => {
            const customerSnapshot = await db.collection("businesses").doc(business.id).collection("customers").get();
            
            let totalStamps = 0;
            let totalRewards = 0;
            const customerEnrollmentDates: number[] = [];

            customerSnapshot.docs.forEach(doc => {
                const data = doc.data();
                totalStamps += data.stamps || 0;
                totalRewards += data.rewardsRedeemed || 0;
                
                const enrollDate = data.enrollmentDate;
                if (enrollDate instanceof firebase.firestore.Timestamp) {
                    customerEnrollmentDates.push(enrollDate.toMillis());
                } else if (enrollDate) {
                    customerEnrollmentDates.push(new Date(enrollDate).getTime());
                }
            });

            const rawCreatedAt = (business as any).createdAt;
            const dateObj = rawCreatedAt instanceof firebase.firestore.Timestamp ? rawCreatedAt.toDate() : (rawCreatedAt ? new Date(rawCreatedAt) : null);

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

export const getGlobalStats = async (): Promise<{ totalBusinesses: number; totalStamps: number; totalRewards: number }> => {
    const businessSnapshot = await db.collection("businesses").get();
    const businesses = businessSnapshot.docs.map(doc => doc.id);

    let totalStamps = 0;
    let totalRewards = 0;

    await Promise.all(
        businesses.map(async (businessId) => {
            const customerSnapshot = await db.collection("businesses").doc(businessId).collection("customers").get();
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
    await db.collection("businesses").doc(businessId).update({ plan });
};

export const deleteBusinessForSuperAdmin = async (businessId: string): Promise<void> => {
    const businessDocRef = db.collection("businesses").doc(businessId);
    const businessSnap = await businessDocRef.get();
    if (!businessSnap.exists) throw new Error("Business not found");
    const slug = businessSnap.data()?.slug;

    // Delete subcollections
    const customerSnapshot = await db.collection("businesses").doc(businessId).collection("customers").get();
    await Promise.all(customerSnapshot.docs.map(d => d.ref.delete()));

    const configSnapshot = await db.collection("businesses").doc(businessId).collection("config").get();
    await Promise.all(configSnapshot.docs.map(d => d.ref.delete()));

    const surveyResponsesSnapshot = await db.collection("businesses").doc(businessId).collection("surveyResponses").get();
    await Promise.all(surveyResponsesSnapshot.docs.map(d => d.ref.delete()));

    // Delete main doc and slug doc
    await businessDocRef.delete();
    if (slug) {
        await db.collection("businessSlugs").doc(slug).delete();
    }
};

// --- SURVEY FUNCTIONS ---

export const getSurveySettings = async (businessId: string) => {
    const surveyConfigSnap = await db.collection("businesses").doc(businessId).collection("config").doc("survey").get();
    if (surveyConfigSnap.exists) {
        return surveyConfigSnap.data();
    } else {
        return null;
    }
};

export const updateSurveySettings = async (businessId: string, settings: any) => {
    await db.collection("businesses").doc(businessId).collection("config").doc("survey").set(settings, { merge: true });
};

export const getSurveyResponses = async (businessId: string, surveyId: string) => {
    if (!surveyId) return [];
    const responseSnapshot = await db.collection("businesses").doc(businessId).collection("surveyResponses")
        .where("surveyId", "==", surveyId)
        .get();
    return responseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const hasCustomerVoted = async (businessId: string, customerId: string, surveyId: string): Promise<boolean> => {
    if (!surveyId) return false;
    const querySnapshot = await db.collection("businesses").doc(businessId).collection("surveyResponses")
        .where("customerId", "==", customerId)
        .where("surveyId", "==", surveyId)
        .limit(1)
        .get();
    return !querySnapshot.empty;
};

export const submitSurveyResponse = async (businessId: string, customerId: string, customerName: string, response: string, surveyId: string): Promise<Customer> => {
    const alreadyVoted = await hasCustomerVoted(businessId, customerId, surveyId);
    if (alreadyVoted) {
        throw new Error("Customer has already voted on this survey.");
    }
    
    await db.collection("businesses").doc(businessId).collection("surveyResponses").add({
        customerId,
        customerName,
        response,
        surveyId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    
    return await addStampToCustomer(businessId, customerId);
};

// --- BLOG FUNCTIONS ---

export const createBlogPost = async (authorId: string, data: Omit<BlogPost, 'id' | 'createdAt' | 'slug'>): Promise<BlogPost> => {
    let slug = slugify(data.title);
    let slugDoc = await db.collection("blogSlugs").doc(slug).get();
    let counter = 1;
    while(slugDoc.exists) {
        slug = `${slugify(data.title)}-${counter}`;
        slugDoc = await db.collection("blogSlugs").doc(slug).get();
        counter++;
    }

    const newPostData = {
        ...data,
        slug,
        authorId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await db.collection("blogPosts").add(newPostData);
    await db.collection("blogSlugs").doc(slug).set({ postId: docRef.id });

    return { ...newPostData, id: docRef.id, createdAt: new Date() } as BlogPost;
};

export const updateBlogPost = async (postId: string, data: Partial<Omit<BlogPost, 'id' | 'slug'>>): Promise<void> => {
    await db.collection("blogPosts").doc(postId).update({ ...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
};

export const deleteBlogPost = async (postId: string, slug: string): Promise<void> => {
    await db.collection("blogPosts").doc(postId).delete();
    await db.collection("blogSlugs").doc(slug).delete();
};

export const getPublishedBlogPosts = async (): Promise<BlogPost[]> => {
    const snapshot = await db.collection("blogPosts").orderBy('createdAt', 'desc').get();
    const allPosts = snapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt;
        let dateObj = new Date();
        if (createdAt instanceof firebase.firestore.Timestamp) dateObj = createdAt.toDate();
        return { 
            id: doc.id, 
            ...data,
            createdAt: dateObj
        } as BlogPost;
    });
    return allPosts.filter(post => post.status === 'published');
};

export const getBlogPostBySlug = async (slug: string): Promise<BlogPost | null> => {
    const slugDocSnap = await db.collection("blogSlugs").doc(slug).get();
    if (slugDocSnap.exists) {
        const postId = slugDocSnap.data()?.postId;
        const postDocSnap = await db.collection("blogPosts").doc(postId).get();
        if (postDocSnap.exists) {
            const data = postDocSnap.data() || {};
            const createdAt = data.createdAt;
            let dateObj = new Date();
            if (createdAt instanceof firebase.firestore.Timestamp) dateObj = createdAt.toDate();
            return { 
                id: postDocSnap.id, 
                ...data,
                createdAt: dateObj
            } as BlogPost;
        }
    }
    return null;
};

export const getAllBlogPostsForAdmin = async (): Promise<BlogPost[]> => {
    const snapshot = await db.collection("blogPosts").orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt;
        let formattedDate = new Date().toISOString().split('T')[0];
        if (createdAt instanceof firebase.firestore.Timestamp) formattedDate = createdAt.toDate().toISOString().split('T')[0];
        return { 
            id: doc.id, 
            ...data,
            createdAt: formattedDate
        } as BlogPost;
    });
};

export const getBlogPostById = async (postId: string): Promise<BlogPost | null> => {
    const docSnap = await db.collection("blogPosts").doc(postId).get();
    if (docSnap.exists) {
        const data = docSnap.data() || {};
        const createdAt = data.createdAt;
        let dateObj = new Date();
        if (createdAt instanceof firebase.firestore.Timestamp) dateObj = createdAt.toDate();
        return { 
            id: docSnap.id, 
            ...data,
            createdAt: dateObj
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
