import tshirt from './tshirt.png';
import dressShirt from './dress-shirt.png';
import polo from './polo.png';
import dress from './dress.png';
import trousers from './trousers.png';
import skirt from './skirt.png';
import jacket from './jacket.png';
import coat from './coat.png';
import shorts from './shorts.png';
import hoodie from './hoodie.png';
import sweatshirt from './sweatshirt.png';
import vest from './vest.png';
import type { GarmentType } from '@/data/fabricData';

export const GARMENT_IMAGES: Record<GarmentType, string> = {
  tshirt,
  'dress-shirt': dressShirt,
  polo,
  dress,
  trousers,
  skirt,
  jacket,
  coat,
  shorts,
  hoodie,
  sweatshirt,
  vest,
};
