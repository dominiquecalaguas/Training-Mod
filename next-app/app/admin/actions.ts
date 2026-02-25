"use server";

import { revalidatePath } from "next/cache";
import { asc, and, eq, lt, gt, desc } from "drizzle-orm";
import { db } from "@/src/db/client";
import { courses, lessons } from "@/src/db/schema";

export async function createCourse(formData: FormData) {
  const title = String(formData.get("title") || "");
  const description = String(formData.get("description") || "");
  const thumbnailUrl = String(formData.get("thumbnailUrl") || "");
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
      title: "Greeting & Identifying Visit Reason",
      content: `### Objective

Give every patient a warm, consistent greeting and quickly understand why they are here today.

### Steps

1. **Initial greeting**
   - Say: "Hi, welcome in! How can we help you today / are we checking in for today?"

2. **Confirm visit reason**
   - If they say they are **here for an appointment**, continue with identity confirmation.
   - If they are here for something else (picking up glasses, dropping something off, etc.), follow the appropriate workflow for that visit type (outside this course).`,
    },
    {
      order: 2,
      title: "Step 1 – Confirm Patient Identity",
      content: `### Objective

Confirm the patient’s identity using full name before opening or changing any chart.

### Steps

1. **Ask for the patient's name**
   - Option 1: "Can I please have you confirm the first and last name?"
   - Option 2: "Can you please confirm the first and last name of the patient who’s here for the appointment?"

2. **Verify in the system**
   - Use the name they provide to locate the correct patient in Crystal.
   - Make sure you select the correct patient if there are similar names (check date of birth if needed).`,
    },
    {
      order: 3,
      title: "Step 2 – Check-In In Crystal",
      content: `### Objective

Properly check the patient in using Crystal and determine whether they are a new or existing patient.

### Steps

1. **Sign the patient in**
   - In Crystal, open the patient’s appointment.
   - Change their status: **Name → Status → Signed-In**.

2. **Determine if the patient is new or existing**
   - Look at the chart to see if this is a **new patient** or an **existing patient**.
   - Follow the appropriate workflow:
     - New patient → see **New Patient Workflow** lesson.
     - Existing patient → see **Existing Patient Workflow** lesson.`,
    },
    {
      order: 4,
      title: "New Patient Workflow",
      content: `### Objective

Make sure new patients complete required forms and understand the dilation waiver before moving on.

### Steps

1. **Confirm digital forms**
   - Say: "I see here that you’re a new patient – were you able to fill out the digital forms we sent?"

2. **If the patient completed digital forms**
   - Say: "Perfect!"
   - Move on to glasses/contacts questions (see **Step 3 – Glasses/Contacts Triage (New Patients)**).

3. **If the patient did NOT complete digital forms**
   - Say: "No worries! I’m going to have you fill this out really quick."
   - Hand them a clipboard with the entrance forms.
   - Explain the forms, including the dilation waiver:
     - "The second sheet has a front and a back, and we already have your insurance information on file so don’t worry about this section."
     - "This waiver on the top is if you don’t want to get dilated today, if you want to speak more with the doctor before you fill it out that’s totally okay."

4. **After forms are handled**
   - Once forms are completed or confirmed, proceed to **Step 3 – Glasses/Contacts Triage (New Patients)**.`,
    },
    {
      order: 5,
      title: "Existing Patient Workflow",
      content: `### Objective

Quickly confirm that an existing patient’s records are up to date before moving on.

> Note: Specific rules for when existing patients need to update forms may be covered in another policy; follow that policy if documented.

### Steps

1. **Confirm any needed updates**
   - Check whether any updated entrance forms or signatures are required based on your office policy.

2. **Ensure information is current in Crystal**
   - Verify contact information, insurance (if needed), and any major changes.

3. **Move on to glasses/contacts questions**
   - Proceed to **Step 3 – Glasses/Contacts Triage (Existing Patients)** once basic information is confirmed.`,
    },
    {
      order: 6,
      title: "Step 3 – Glasses/Contacts Triage (New Patients)",
      content: `### Objective

Find out whether the new patient wears glasses or contacts and capture their current prescriptions in Crystal.

### Steps

1. **Ask about glasses and contacts**
   - Say: "Do you currently wear any glasses or contacts?"

2. **If the new patient wears glasses**
   - Say: "Awesome! Is it okay if we take your glasses to check the prescription and clean them for you?"  
     - **Do not clean** if the patient is running late.
   - Ask if they also wear contacts.
   - Use the lensometer to read the glasses prescription:
     - Measure base curve (BC).
     - Markings go by 0.25.
     - Record from **right to left**.
     - If BC is the same for both lenses, write **\"OU\"**.
   - Clean the glasses using the ultrasonic machine (unless the patient is late).
   - While the glasses are cleaning, input data into Crystal:
     - Go to **Record → Refraction**.
     - Fill in the **Previous Glasses Correction** field.
     - Put **BC** in the **Notes** field.

3. **If the new patient wears contacts**
   - Say: "Great! Were you able to bring your current prescription or a picture of your current contact lens boxes?"
   - Ask if they also wear glasses.
   - Input their contact lens information into Crystal.

4. **If the new patient does not wear glasses or contacts**
   - Say: "Perfect! Let me just make sure your information is updated in our system, go ahead and have a seat and we’ll call you up shortly."
   - Make sure all records are updated in Crystal.
   - Take the patient straight to **pretesting** when ready.`,
    },
    {
      order: 7,
      title: "Step 3 – Glasses/Contacts Triage (Existing Patients)",
      content: `### Objective

Handle existing patients’ glasses and contacts efficiently, including special edge cases.

### Steps

1. **If the existing patient wears glasses**
   - Say: "Awesome! Is it okay if we take your glasses to clean them for you and make sure the screws are tight?"  
     - **Obtain the glasses**.
     - Then say: "Thank you! Did you get these with us or from somewhere else?"
   - If **frames are from us but lenses are from somewhere else**, treat them like a new patient for lens data.
   - If the patient is **running late**, **do not clean** the glasses.
   - While the glasses are cleaning (if applicable), input or confirm data in Crystal.

2. **If the existing patient wears contacts**
   - Say: "Perfect! Go ahead and take a seat and the doctor will be with you shortly."
   - No need to pretest solely because of contacts if not otherwise required.

3. **If the existing patient does not wear glasses or contacts**
   - Say: "Perfect! Let me just make sure your information is updated in our system, go ahead and have a seat and we’ll call you up shortly."
   - Ensure all records are updated in Crystal.
   - Take the patient straight to **pretesting** when ready.`,
    },
    {
      order: 8,
      title: "Step 4 – Pretesting Workflow",
      content: `### Objective

Complete auto-refraction and fundus photos when appropriate, with clear instructions to the patient.

### When to pretest

- When possible, input the patient’s information into the fundus machine **before** the appointment starts.
- Fundus photos are **only for patients over 18**, unless the folder specifically says to take fundus photos.

### Auto-refraction

1. **Prepare the machine and patient**
   - Clean the chin rest.
   - Make sure the patient’s eye is level with the markings.
   - Adjust the table height and have the patient scoot their chair in if needed.

2. **Explain what they will see**
   - Say: "You should be seeing an image of either a yellow house or a blurry circle in the middle, try your best to focus on the object in the center."

3. **Take the measurements**
   - Follow your standard procedure for capturing auto-refraction readings for each eye.

### Fundus photos

1. **Prepare the machine and patient**
   - Clean the chin rest.
   - Make sure the patient’s eye is level with the markings.
   - Adjust the table height and have the patient scoot their chair in if needed.

2. **Explain the procedure**
   - Say: "This machine is going to take a picture of the back of your eye. There’s going to be a bright flash so try your best not to blink, but I’m going to give you a countdown before I take the photo so you’re ready."

3. **Capture the photos**
   - Take clear images for both eyes, following your normal protocol.

### After pretesting

1. **Release the patient to the waiting room**
   - Say: "Alright you’re all set! Go ahead and have a seat in the waiting room and the doctor will be with you shortly!"

2. **Proceed to documenting in Crystal**
   - See **Documenting in Crystal Post-Pretest** for how to enter the results.`,
    },
    {
      order: 9,
      title: "Documenting in Crystal Post-Pretest",
      content: `### Objective

Accurately record pretesting data and medical history in Crystal so the doctor has complete information.

### Entering auto-refraction and glasses data

1. **Auto-refraction**
   - Go to **Record → Refraction** in Crystal.
   - Fill in the **Auto refraction** field with the data from the pretesting room.

2. **Previous prescription**
   - Click **Previous Rx**.
   - If nothing pops up because the patient is new, that is okay.

3. **Minimum data when busy**
   - If the schedule is very busy, always make sure to at least input:
     - The **auto-refraction** results.
     - The **glasses prescription**.

### Medical History tab

1. **Reason for visit**
   - Fill in the **reason for visit**.
   - Type **"Co"** and hit enter to auto-fill: "Complete eye exam to rule out all problems".

2. **For new patients (after entrance forms are filled out)**
   - Click **All Previous**, then **All Normal**, then update with any information from their entrance forms.
   - Enter:
     - Year of last eye exam.
     - Review of ocular system and family ocular history.
     - Age of glasses.
     - Review of systems.
     - Smoking and alcohol status.`,
    },
    {
      order: 10,
      title: "Handoff to Doctor",
      content: `### Objective

Complete the check-in and pretesting workflow by handing the patient off cleanly to the doctor.

### Steps

1. **Prepare the folder**
   - Place the patient’s folder in the **"checked in"** slot for the doctor.
   - If the doctor’s door is open and appropriate, you can hand the folder directly to the doctor.

2. **Close the chart so the doctor can access it**
   - Make sure you **click out of the patient’s file** in Crystal.
   - This frees the chart so the doctor can open it without any access issues.

3. **Confirm the patient is waiting comfortably**
   - Ensure the patient knows they can sit in the waiting room and that the doctor will be with them shortly.`,
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

