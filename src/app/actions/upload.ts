'use server';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export async function uploadFile(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) {
    return { error: 'No file provided' };
  }
  const userId = formData.get('userId') as string;
  if (!userId) {
    return { error: 'User ID not provided' };
  }

  try {
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const storageRef = ref(storage, `profile-photos/${userId}.${fileExtension}`);
    
    // Convert file to buffer to upload from server
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const snapshot = await uploadBytes(storageRef, buffer, {
      contentType: file.type
    });
    
    const downloadURL = await getDownloadURL(snapshot.ref);

    return { success: true, url: downloadURL };
  } catch (error: any) {
    console.error("--- UPLOAD FAILED ---");
    console.error("Error:", error);
    // Provide a more specific error for CORS to guide the user if this method still fails.
    if (error.code === 'storage/unauthorized') {
       return { error: 'File upload failed due to permissions. Please ensure your Firebase Storage rules allow writes.' };
    }
    return { error: 'File upload failed.' };
  }
}
