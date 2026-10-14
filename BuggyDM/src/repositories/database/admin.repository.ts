import { prisma } from "@/lib/prisma";

export class AdminRepository {
  static async findByEmail(email: string) {
    return await prisma.admins.findUnique({
      where: { email },
      select: {
        id: true,
        f_name: true,
        l_name: true,
        phone: true,
        email: true,
        password: true,
        role_id: true,
      },
    });
  }

  static async findById(id: number) {
    return await prisma.admins.findUnique({
      where: { id: BigInt(id) },
      select: {
        id: true,
        f_name: true,
        l_name: true,
        phone: true,
        email: true,
        password: true,
        role_id: true,
      },
    });
  }

  static async updateLoginStats(id: number, data: {
    lastLoginAt?: Date;
    loginRememberToken?: string;
    isLoggedIn?: boolean;
  }) {
    try {
      return await prisma.admins.update({
        where: { id: BigInt(id) },
        data: {
          updated_at: new Date(),
          login_remember_token: data.loginRememberToken,
          is_logged_in: data.isLoggedIn,
        },
        select: {
          id: true,
        },
      });
    } catch {
      return null;
    }
  }

  static async findPermissionKeys(roleId: number): Promise<string[]> {
    if (roleId === 1) {
      return ["*"];
    }

    try {
      const permissions = await prisma.qcom_rbac_roles_permissions.findMany({
        where: { role_id: BigInt(roleId) },
        select: { permission_key: true },
      });
      return [...new Set(permissions.map(({ permission_key }) => permission_key))];
    } catch {
      return [];
    }
  }
}

