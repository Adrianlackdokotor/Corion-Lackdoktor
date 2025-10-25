import bcrypt from "bcrypt";
import { storage } from "./storage";

const SALT_ROUNDS = 10;

async function seedAdminUser() {
  try {
    console.log("🌱 Seeding admin user...");

    const adminEmail = "adrianlackdoktor@gmail.com";
    
    // Check if admin already exists
    const existingAdmin = await storage.getUserByEmail(adminEmail);
    
    if (existingAdmin) {
      console.log("✅ Admin user already exists");
      return;
    }

    // Create temporary password (user should change this on first login)
    const tempPassword = "Corion2025!Admin";
    const hashedPassword = await bcrypt.hash(tempPassword, SALT_ROUNDS);

    // Create admin user
    const adminUser = await storage.createUser({
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      emailVerified: true,
    });

    console.log("✅ Admin user created successfully!");
    console.log("📧 Email:", adminEmail);
    console.log("🔑 Temporary Password:", tempPassword);
    console.log("⚠️  Please change the password after first login");
    
  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
    process.exit(1);
  }
}

seedAdminUser();
