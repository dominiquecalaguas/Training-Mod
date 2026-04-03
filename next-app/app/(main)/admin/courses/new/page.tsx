import { createCourse } from "../../actions";
import { NewCourseForm } from "./NewCourseForm";

export default function NewCoursePage() {
  return <NewCourseForm action={createCourse} />;
}


