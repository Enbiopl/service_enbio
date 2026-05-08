import { Suspense } from "react"
import FormContainer from "@/components/form-container"

export default function ServiceFormPage() {
  return (
    <Suspense fallback={null}>
      <FormContainer />
    </Suspense>
  )
}
