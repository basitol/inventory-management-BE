// src/utils/cachePermissions.ts
import mongoose from 'mongoose';
import {Permission, IPermission} from '../models/Permission';

// Cache for storing permission names
let permissionCache: Record<string, string> = {};

export const cachePermissions = async () => {
  if (Object.keys(permissionCache).length === 0) {
    const permissions: IPermission[] = await Permission.find();

    permissionCache = permissions.reduce(
      (acc: Record<string, string>, permission: IPermission) => {
        acc[permission._id.toString()] = permission.name;
        return acc;
      },
      {},
    );

    console.log('Permissions cached:', permissionCache);
  }
};

export const getPermissionNames = (
  permissionIds: mongoose.Types.ObjectId[],
): string[] => {
  return permissionIds.map(id => permissionCache[id.toString()] || 'Unknown');
};
