"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { asc, and, eq, lt, gt, desc } from "drizzle-orm";
import { db } from "@/src/db/client";
import { courses, lessons } from "@/src/db/schema";

export async function createCourse(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const thumbnailUrl = String(formData.get("thumbnailUrl") || "").trim();
  const order = Number(formData.get("order") || "0");

  if (!title) return;

  await db.insert(courses).values({
    title,
    description: description || null,
    thumbnailUrl: thumbnailUrl || null,
    order,
  });

  revalidatePath("/admin/courses");
  revalidatePath("/");
  redirect("/admin/courses");
}

export async function updateCourse(formData: FormData) {
  const id = Number(formData.get("id") || "0");
  const title = String(formData.get("title") || "");
  const description = String(formData.get("description") || "");
  const thumbnailUrl = String(formData.get("thumbnailUrl") || "");
  const order = Number(formData.get("order") || "0");

  if (!id || !title) return;

  await db
    .update(courses)
    .set({
      title,
      description: description || null,
      thumbnailUrl: thumbnailUrl || null,
      order,
    })
    .where(eq(courses.id, id));

  revalidatePath("/admin/courses");
  revalidatePath("/");
}

export async function deleteCourse(formData: FormData) {
  const id = Number(formData.get("id") || "0");
  if (!id) return;

  await db.delete(courses).where(eq(courses.id, id));
  revalidatePath("/admin/courses");
  revalidatePath("/");
}

export async function reorderCourse(formData: FormData) {
  const id = Number(formData.get("id") || "0");
  const direction = String(formData.get("direction") || "");
  if (!id || (direction !== "up" && direction !== "down")) return;

  const [current] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, id))
    .limit(1);
  if (!current) return;

  const targetWhere =
    direction === "up"
      ? lt(courses.order, current.order)
      : gt(courses.order, current.order);

  const [neighbor] = await db
    .select()
    .from(courses)
    .where(targetWhere)
    .orderBy(
      direction === "up" ? desc(courses.order) : asc(courses.order),
    )
    .limit(1);

  if (!neighbor) return;

  await db
    .update(courses)
    .set({ order: neighbor.order })
    .where(eq(courses.id, current.id));

  await db
    .update(courses)
    .set({ order: current.order })
    .where(eq(courses.id, neighbor.id));

  revalidatePath("/admin/courses");
  revalidatePath("/");
}

export async function createLesson(formData: FormData) {
  const courseId = Number(formData.get("courseId") || "0");
  const title = String(formData.get("title") || "");
  const content = String(formData.get("content") || "");
  const order = Number(formData.get("order") || "0");

  if (!courseId || !title) return;

  await db.insert(lessons).values({
    courseId,
    title,
    content,
    order,
  });

  revalidatePath(`/admin/courses/${courseId}/lessons`);
  revalidatePath(`/courses/${courseId}`);
}

export async function updateLesson(formData: FormData) {
  const id = Number(formData.get("id") || "0");
  const courseId = Number(formData.get("courseId") || "0");
  const title = String(formData.get("title") || "");
  const content = String(formData.get("content") || "");
  const order = Number(formData.get("order") || "0");

  if (!id || !courseId || !title) return;

  await db
    .update(lessons)
    .set({
      title,
      content,
      order,
    })
    .where(eq(lessons.id, id));

  revalidatePath(`/admin/courses/${courseId}/lessons`);
  revalidatePath(`/courses/${courseId}`);
}

export async function deleteLesson(formData: FormData) {
  const id = Number(formData.get("id") || "0");
  const courseId = Number(formData.get("courseId") || "0");
  if (!id || !courseId) return;

  await db.delete(lessons).where(eq(lessons.id, id));

  revalidatePath(`/admin/courses/${courseId}/lessons`);
  revalidatePath(`/courses/${courseId}`);
}

export async function reorderLesson(formData: FormData) {
  const id = Number(formData.get("id") || "0");
  const courseId = Number(formData.get("courseId") || "0");
  const direction = String(formData.get("direction") || "");
  if (!id || !courseId || (direction !== "up" && direction !== "down")) return;

  const [current] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.id, id), eq(lessons.courseId, courseId)))
    .limit(1);
  if (!current) return;

  const targetWhere =
    direction === "up"
      ? and(
          eq(lessons.courseId, courseId),
          lt(lessons.order, current.order),
        )
      : and(
          eq(lessons.courseId, courseId),
          gt(lessons.order, current.order),
        );

  const [neighbor] = await db
    .select()
    .from(lessons)
    .where(targetWhere)
    .orderBy(
      direction === "up" ? desc(lessons.order) : asc(lessons.order),
    )
    .limit(1);

  if (!neighbor) return;

  await db
    .update(lessons)
    .set({ order: neighbor.order })
    .where(eq(lessons.id, current.id));

  await db
    .update(lessons)
    .set({ order: current.order })
    .where(eq(lessons.id, neighbor.id));

  revalidatePath(`/admin/courses/${courseId}/lessons`);
  revalidatePath(`/courses/${courseId}`);
}

export async function seedCheckInProceduresCourse() {
  const title = "Check-In Procedures";
  const description =
    "Front desk check-in workflow from greeting through pretesting and handoff to the doctor.";

  const existingCourses = await db
    .select()
    .from(courses)
    .orderBy(asc(courses.order));

  const existing = existingCourses.find((c) => c.title === title);

  let courseId: number;

  if (existing) {
    courseId = existing.id;
  } else {
    const order = existingCourses.length + 1;
    const [inserted] = await db
      .insert(courses)
      .values({
        title,
        description,
        thumbnailUrl: null,
        order,
      })
      .returning();

    courseId = inserted.id;
  }

  const lessonConfigs: {
    order: number;
    title: string;
    content: string;
  }[] = [
    {
      order: 1,
      title: "Greeting",
      content: `Use this greeting when the patient is here for an appointment:

**"Hi, welcome in! How can we help you today / are we checking in for today?"**`,
    },
    {
      order: 2,
      title: "Step 1 – Ask for the Patient's Name",
      content: `Ask for the patient’s name using one of these scripts:

- **"Can I please have you confirm the first and last name?"**
- or **"Can you please confirm the first and last name of the patient who’s here for the appointment?"**`,
    },
    {
      order: 3,
      title: "Step 2 – Check Patient Into Crystal (New vs Existing)",
      content: `### Check patient into Crystal

- **Name → Status → Signed-In**
- Sign the patient in, then check if they are **new** or **existing**.

### Next steps

- **Pt. is new** → See lesson **New Patient – Digital Forms & Dilation Waiver**, then **Step 3 – Glasses or Contacts (New Patients)**.
- **Pt. is existing** → Go to **Step 3 – Glasses or Contacts (Existing Patients)**.`,
    },
    {
      order: 4,
      title: "New Patient – Digital Forms & Dilation Waiver",
      content: `Say: **"I see here that you’re a new patient – were you able to fill out the digital forms we sent?"**

- **Yes:** Say **"Perfect!"** → Move onto next step (Step 3 – Glasses or Contacts for new patients).

- **No:** Say **"No worries! I’m going to have you fill this out really quick"** → Hand them a clipboard and have them fill out the entrance form. Inform them of the **"Refusal to Dilate"** form using this script:

  **"The second sheet has a front and a back, and we already have your insurance information on file so don’t worry about this section. This waiver on the top is if you don’t want to get dilated today, if you want to speak more with the doctor before you fill it out that’s totally okay."**

Then move onto the next step.`,
    },
    {
      order: 5,
      title: "Step 3 – Glasses or Contacts (New Patients)",
      content: `Ask: **"Do you currently wear any glasses or contacts?"**

### Yes to glasses

- **"Awesome! Is it okay if we take your glasses to check the prescription and clean them for you?"** (No cleaning if patient is late.)
- Ask if they wear contacts as well.
- Use lensometer to read prescription:
  - Measure base curve (BC).
  - Markings go by 0.25.
  - Record from **right to left**.
  - If BC is the same for both lenses, write **"OU"**.
- Clean glasses using ultrasonic machine.
- While glasses are cleaning, input data into Crystal:
  - **Record → Refraction** → fill in **"Previous Glasses Correction"** field.
  - Put **BC** in **Notes**.

### Yes to contacts

- **"Great! Were you able to bring your current prescription or a picture of your current contact lens boxes?"**
- Ask if they wear glasses as well.
- Input data into Crystal.

### No to either

- **"Perfect! Let me just make sure your information is updated in our system, go ahead and have a seat and we’ll call you up shortly."**
- Take patient straight to pretesting after making sure all records are updated in Crystal.`,
    },
    {
      order: 6,
      title: "Step 3 – Glasses or Contacts (Existing Patients)",
      content: `Ask: **"Do you currently wear any glasses or contacts?"**

### Yes to glasses

- **"Awesome! Is it okay if we take your glasses to clean them for you and make sure the screws are tight?"** → **Obtain glasses** → **"Thank you! Did you get these with us or from somewhere else?"**
  - **1a.** If frames are from us but lenses are from somewhere else, treat like new patient for lens data.
  - **1b.** If patient is running late, **DO NOT** clean glasses.
- While glasses are cleaning, input data into Crystal.

### Yes to contacts

- **"Perfect! Go ahead and take a seat and the doctor will be with you shortly."**
- No need to pretest.

### No to either

- **"Perfect! Let me just make sure your information is updated in our system, go ahead and have a seat and we’ll call you up shortly."**
- Take patient straight to pretesting after making sure all records are updated in Crystal.`,
    },
    {
      order: 7,
      title: "Step 4 – Pretesting the Patient",
      content: `### Before you start

- When possible, input the patient’s info into the fundus machine **before** their appointment starts.
- Fundus photos: **only for patients over 18**, unless the folder says to take fundus.

### Auto-refraction

- Clean chin rest; make sure eye is level to markings and table is at the right height; have pt. scoot their chair in if needed. Then take measurements.
- Say: **"You should be seeing an image of either a yellow house or a blurry circle in the middle, try your best to focus on the object in the center."**

### Fundus photos

- Clean chin rest; make sure eye is level to markings and table is at the right height; have pt. scoot their chair in if needed. Then take photos.
- Say: **"This machine is going to take a picture of the back of your eye. There’s going to be a bright flash so try your best not to blink, but I’m going to give you a countdown before I take the photo so you’re ready."**

### After pretesting

- Say: **"Alright you’re all set! Go ahead and have a seat in the waiting room and the doctor will be with you shortly!"**
- Then input data into Crystal (see next lesson).`,
    },
    {
      order: 8,
      title: "Documenting in Crystal & Handoff to Doctor",
      content: `### Input data into Crystal

- **Record → Refraction** → fill in **"Auto refraction"** field with data from pretesting room. Click **"Previous Rx"** (if nothing pops up because they’re new, it’s okay).
- If it’s busy, **always** at least input **auto-refraction** and **glasses prescription**.

### Medical History tab

- Fill in **"reason for visit"** → type **"Co"** and hit enter (auto-fills **"Complete eye exam to rule out all problems"**).
- **Pt. is new:** Don’t fill out until entrance forms are filled. Then click **"All Previous"**, then **"All Normal"**, then fill in information from their entrance forms: year of last eye exam, review of ocular system & family ocular history, age of glasses, review of systems, smoking + alcohol status.

### Handoff

- Place folder in **"checked in"** slot for the doctor (or hand over if door is open).
- **Make sure to click out of the patient’s file** so the doctor can access it.`,
    },
  ];

  const existingLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, courseId));

  for (const config of lessonConfigs) {
    const match = existingLessons.find((l) => l.order === config.order);
    if (match) {
      await db
        .update(lessons)
        .set({
          title: config.title,
          content: config.content,
          order: config.order,
        })
        .where(eq(lessons.id, match.id));
    } else {
      await db.insert(lessons).values({
        courseId,
        title: config.title,
        content: config.content,
        order: config.order,
      });
    }
  }

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}/lessons`);
  revalidatePath("/");
  revalidatePath(`/courses/${courseId}`);
}

