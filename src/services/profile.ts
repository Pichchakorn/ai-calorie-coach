// services/profile.ts
export async function updateProfileWeight(uid: string, weight: number) {
  // Firestore:
  // await updateDoc(doc(db, 'users', uid), { 'profile.weight': weight, 'profile.updatedAt': serverTimestamp() });

  // ถ้า LocalStorage:
   const key = `profile:${uid}`;
   const p = JSON.parse(localStorage.getItem(key) || '{}');
   p.profile = { ...(p.profile||{}), weight, updatedAt: Date.now() };
   localStorage.setItem(key, JSON.stringify(p));
}
