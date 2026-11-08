import React from 'react';
import {
  Fuel,
  TreePine,
  PlusCircle,
  Leaf,
  Cigarette,
  Wine,
  Beer,
  Fish,
  UtensilsCrossed,
  ShoppingBag,
  CircleDollarSign,
  LucideProps,
} from 'lucide-react';
import { CategoryId } from '../types/finance';

interface CategoryIconProps extends LucideProps {
  id?: CategoryId | string;
  iconName?: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ id, iconName, className = 'w-5 h-5', ...props }) => {
  const icon = iconName || id;

  switch (icon) {
    case 'gasolina':
    case 'Fuel':
      return <Fuel className={className} {...props} />;
    case 'leña':
    case 'TreePine':
      return <TreePine className={className} {...props} />;
    case 'otro_ingreso':
    case 'PlusCircle':
      return <PlusCircle className={className} {...props} />;
    case 'bolo':
    case 'Leaf':
      return <Leaf className={className} {...props} />;
    case 'cigarro':
    case 'Cigarette':
      return <Cigarette className={className} {...props} />;
    case 'trago_cerveza':
    case 'trago':
    case 'cerveza':
    case 'Beer':
    case 'Wine':
      return <Beer className={className} {...props} />;
    case 'pesca':
    case 'Fish':
      return <Fish className={className} {...props} />;
    case 'comida':
    case 'UtensilsCrossed':
      return <UtensilsCrossed className={className} {...props} />;
    case 'otro_gasto':
    case 'ShoppingBag':
      return <ShoppingBag className={className} {...props} />;
    default:
      return <CircleDollarSign className={className} {...props} />;
  }
};
