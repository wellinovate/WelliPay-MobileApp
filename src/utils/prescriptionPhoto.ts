import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const MAX_WIDTH = 1600;

// Bytes carried by a base64 string.
export function base64Bytes(b64: string): number {
  const pad = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - pad;
}

export interface PickedPhoto { contentType: 'image/jpeg'; dataBase64: string }

// Opens the camera or the photo library, shrinks the picture to a JPEG under the
// server's 4 MB limit and returns it as base64. Returns null if the person backs out.
// Throws an Error with a message fit to show on screen.
export async function pickPrescriptionPhoto(source: 'camera' | 'library'): Promise<PickedPhoto | null> {
  const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error(source === 'camera' ? 'Allow camera access in your phone settings to take a photo.' : 'Allow photo access in your phone settings to choose a photo.');
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
  const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
  if (res.canceled || !res.assets || res.assets.length === 0) return null;
  const asset = res.assets[0];
  const ctx = ImageManipulator.manipulate(asset.uri);
  if (asset.width > MAX_WIDTH) ctx.resize({ width: MAX_WIDTH });
  const rendered = await ctx.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
  if (!saved.base64) throw new Error('The photo could not be read. Try again.');
  if (base64Bytes(saved.base64) > MAX_PHOTO_BYTES) throw new Error('The photo is too large. Move closer to the page and try again.');
  return { contentType: 'image/jpeg', dataBase64: saved.base64 };
}
