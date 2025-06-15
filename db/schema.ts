import { pgTable, serial, text, timestamp, boolean, integer, decimal } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Administrator model
export const administrators = pgTable("administrators", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
})

// Chapter model
export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  splitCode: text("split_code"),
  amount: decimal("amount", { precision: 10, scale: 2 }).default("3000.00"),
  createdAt: timestamp("created_at").defaultNow(),
})

// School model
export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id").references(() => chapters.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
})

// Center model
export const centers = pgTable("centers", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id").references(() => chapters.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
})

// Chapter Coordinator model (updated with slot fields)
export const chapterCoordinators = pgTable("chapter_coordinators", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id").references(() => chapters.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  uniqueCode: text("unique_code").unique().notNull(),
  currentSlots: integer("current_slots").default(0),
  totalSlotsPurchased: integer("total_slots_purchased").default(0),
  passwordHash: text("password_hash"),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Slot Packages model
export const slotPackages = pgTable("slot_packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slotCount: integer("slot_count").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Chapter Split Codes model
export const chapterSplitCodes = pgTable("chapter_split_codes", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id").references(() => chapters.id),
  slotPackageId: integer("slot_package_id").references(() => slotPackages.id),
  splitCode: text("split_code").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Slot Purchases model
export const slotPurchases = pgTable("slot_purchases", {
  id: serial("id").primaryKey(),
  coordinatorId: integer("coordinator_id").references(() => chapterCoordinators.id),
  chapterId: integer("chapter_id").references(() => chapters.id),
  slotPackageId: integer("slot_package_id").references(() => slotPackages.id),
  slotsPurchased: integer("slots_purchased").notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).notNull(),
  paymentReference: text("payment_reference").unique().notNull(),
  paymentStatus: text("payment_status", { enum: ["pending", "completed", "failed"] }).default("pending"),
  paystackReference: text("paystack_reference"),
  splitCodeUsed: text("split_code_used"),
  purchaseDate: timestamp("purchase_date").defaultNow(),
  paymentVerifiedAt: timestamp("payment_verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Coordinator Slots model
export const coordinatorSlots = pgTable("coordinator_slots", {
  id: serial("id").primaryKey(),
  coordinatorId: integer("coordinator_id").references(() => chapterCoordinators.id),
  chapterId: integer("chapter_id").references(() => chapters.id),
  availableSlots: integer("available_slots").default(0),
  usedSlots: integer("used_slots").default(0),
  totalPurchasedSlots: integer("total_purchased_slots").default(0),
  lastPurchaseDate: timestamp("last_purchase_date"),
  lastUsageDate: timestamp("last_usage_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Slot Usage History model
export const slotUsageHistory = pgTable("slot_usage_history", {
  id: serial("id").primaryKey(),
  coordinatorId: integer("coordinator_id").references(() => chapterCoordinators.id),
  registrationId: integer("registration_id").references(() => registrations.id),
  slotsUsed: integer("slots_used").default(1),
  usageType: text("usage_type", { enum: ["registration", "bulk_registration", "adjustment"] }).default("registration"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
})

// Registration model (updated with coordinator fields)
export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
  registrationNumber: text("registration_number").unique().notNull(),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  lastName: text("last_name").notNull(),
  chapterId: integer("chapter_id").references(() => chapters.id),
  schoolId: integer("school_id").references(() => schools.id),
  schoolName: text("school_name"),
  centerId: integer("center_id").references(() => centers.id),
  parentFirstName: text("parent_first_name").notNull(),
  parentLastName: text("parent_last_name").notNull(),
  parentPhone: text("parent_phone").notNull(),
  parentEmail: text("parent_email").notNull(),
  parentConsent: boolean("parent_consent").default(false),
  passportUrl: text("passport_url").notNull(),
  paymentStatus: text("payment_status", { enum: ["pending", "completed"] }).default("pending"),
  paymentReference: text("payment_reference"),
  splitCodeUsed: text("split_code_used"), // Track which split code was used for this registration
  coordinatorRegisteredBy: integer("coordinator_registered_by").references(() => chapterCoordinators.id),
  registrationType: text("registration_type", { enum: ["public", "coordinator"] }).default("public"),
  registrationSlipDownloaded: boolean("registration_slip_downloaded").default(false),
  registrationSlipDownloadCount: integer("registration_slip_download_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
})

// Facilitators model
export const facilitators = pgTable("facilitators", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id").references(() => chapters.id),
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  position: integer("position").notNull(), // 1 or 2 (for the two facilitators per chapter)
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Settings model
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Subject model
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  maxScore: integer("max_score").notNull().default(100),
  minScore: integer("min_score").notNull().default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
})

// Result Entry Users model (for chapter-specific result entry access)
export const resultEntryUsers = pgTable("result_entry_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  chapterId: integer("chapter_id").references(() => chapters.id),
  name: text("name").notNull(),
  email: text("email"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
})

// Student Results model
export const studentResults = pgTable("student_results", {
  id: serial("id").primaryKey(),
  registrationId: integer("registration_id").references(() => registrations.id),
  subjectId: integer("subject_id").references(() => subjects.id),
  score: integer("score").notNull(),
  grade: text("grade"),
  enteredBy: integer("entered_by").references(() => resultEntryUsers.id),
  enteredAt: timestamp("entered_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Define relations
export const chaptersRelations = relations(chapters, ({ many }) => ({
  schools: many(schools),
  centers: many(centers),
  registrations: many(registrations),
  coordinators: many(chapterCoordinators),
  resultEntryUsers: many(resultEntryUsers),
  splitCodes: many(chapterSplitCodes),
  slotPurchases: many(slotPurchases),
  coordinatorSlots: many(coordinatorSlots),
  facilitators: many(facilitators),
}))

export const schoolsRelations = relations(schools, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [schools.chapterId],
    references: [chapters.id],
  }),
  registrations: many(registrations),
}))

export const centersRelations = relations(centers, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [centers.chapterId],
    references: [chapters.id],
  }),
  registrations: many(registrations),
}))

export const chapterCoordinatorsRelations = relations(chapterCoordinators, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [chapterCoordinators.chapterId],
    references: [chapters.id],
  }),
  slotPurchases: many(slotPurchases),
  coordinatorSlots: many(coordinatorSlots),
  slotUsageHistory: many(slotUsageHistory),
  registrations: many(registrations),
}))

export const slotPackagesRelations = relations(slotPackages, ({ many }) => ({
  splitCodes: many(chapterSplitCodes),
  purchases: many(slotPurchases),
}))

export const chapterSplitCodesRelations = relations(chapterSplitCodes, ({ one }) => ({
  chapter: one(chapters, {
    fields: [chapterSplitCodes.chapterId],
    references: [chapters.id],
  }),
  slotPackage: one(slotPackages, {
    fields: [chapterSplitCodes.slotPackageId],
    references: [slotPackages.id],
  }),
}))

export const slotPurchasesRelations = relations(slotPurchases, ({ one }) => ({
  coordinator: one(chapterCoordinators, {
    fields: [slotPurchases.coordinatorId],
    references: [chapterCoordinators.id],
  }),
  chapter: one(chapters, {
    fields: [slotPurchases.chapterId],
    references: [chapters.id],
  }),
  slotPackage: one(slotPackages, {
    fields: [slotPurchases.slotPackageId],
    references: [slotPackages.id],
  }),
}))

export const coordinatorSlotsRelations = relations(coordinatorSlots, ({ one }) => ({
  coordinator: one(chapterCoordinators, {
    fields: [coordinatorSlots.coordinatorId],
    references: [chapterCoordinators.id],
  }),
  chapter: one(chapters, {
    fields: [coordinatorSlots.chapterId],
    references: [chapters.id],
  }),
}))

export const slotUsageHistoryRelations = relations(slotUsageHistory, ({ one }) => ({
  coordinator: one(chapterCoordinators, {
    fields: [slotUsageHistory.coordinatorId],
    references: [chapterCoordinators.id],
  }),
  registration: one(registrations, {
    fields: [slotUsageHistory.registrationId],
    references: [registrations.id],
  }),
}))

export const registrationsRelations = relations(registrations, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [registrations.chapterId],
    references: [chapters.id],
  }),
  school: one(schools, {
    fields: [registrations.schoolId],
    references: [schools.id],
  }),
  center: one(centers, {
    fields: [registrations.centerId],
    references: [centers.id],
  }),
  coordinatorRegisteredBy: one(chapterCoordinators, {
    fields: [registrations.coordinatorRegisteredBy],
    references: [chapterCoordinators.id],
  }),
  results: many(studentResults),
  slotUsageHistory: many(slotUsageHistory),
}))

export const facilitatorsRelations = relations(facilitators, ({ one }) => ({
  chapter: one(chapters, {
    fields: [facilitators.chapterId],
    references: [chapters.id],
  }),
}))

export const subjectsRelations = relations(subjects, ({ many }) => ({
  results: many(studentResults),
}))

export const resultEntryUsersRelations = relations(resultEntryUsers, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [resultEntryUsers.chapterId],
    references: [chapters.id],
  }),
  results: many(studentResults),
}))

export const studentResultsRelations = relations(studentResults, ({ one }) => ({
  registration: one(registrations, {
    fields: [studentResults.registrationId],
    references: [registrations.id],
  }),
  subject: one(subjects, {
    fields: [studentResults.subjectId],
    references: [subjects.id],
  }),
  enteredByUser: one(resultEntryUsers, {
    fields: [studentResults.enteredBy],
    references: [resultEntryUsers.id],
  }),
}))
