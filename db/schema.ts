import { pgTable, serial, text, timestamp, boolean, integer, decimal } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

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

// Registration model
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
  createdAt: timestamp("created_at").defaultNow(),
})

// Chapter Coordinator model
export const chapterCoordinators = pgTable("chapter_coordinators", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id").references(() => chapters.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  uniqueCode: text("unique_code").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
})

// Settings model
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value"),
})

// Define relations
export const chaptersRelations = relations(chapters, ({ many }) => ({
  schools: many(schools),
  centers: many(centers),
  registrations: many(registrations),
  coordinators: many(chapterCoordinators),
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

export const registrationsRelations = relations(registrations, ({ one }) => ({
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
}))

export const chapterCoordinatorsRelations = relations(chapterCoordinators, ({ one }) => ({
  chapter: one(chapters, {
    fields: [chapterCoordinators.chapterId],
    references: [chapters.id],
  }),
}))
