"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface SupportFormProps {
  onNext: (serviceType: string) => void
}

export default function SupportForm({ onNext }: SupportFormProps) {
  const searchParams = useSearchParams()
  const language = searchParams.get("lang") || "en"
  const t = (pl: string, en: string) => (language === "pl" ? pl : en)
  const [serviceType, setServiceType] = useState<string | undefined>(undefined)
  const [isOpen, setIsOpen] = useState(false)

  const handleServiceTypeChange = (type: string) => {
    setServiceType(type)
    onNext(type)
  }

  return (
    <>
      {/* Main h1 title is now in FormContainer */}
      <h2 className="text-gray-900 text-xl font-medium mb-6">{t("1. Dane urządzenia", "1. Device data")}</h2>

      <div className="bg-gray-50 rounded-md p-5 w-[430px] ml-0 border border-gray-200">
        <div className="space-y-6">
          <div
            className={`flex items-start gap-3 transition-all duration-300 ease-in-out hover:bg-gray-100 rounded-md p-2 -m-2 cursor-pointer ${serviceType === "warranty" ? "bg-gray-100" : ""}`}
            onClick={() => handleServiceTypeChange("warranty")}
          >
            <div className="mt-1 relative flex items-center justify-center">
              <input
                type="radio"
                id="warranty"
                name="serviceType"
                value="warranty"
                checked={serviceType === "warranty"}
                onChange={() => {}}
                className="appearance-none w-5 h-5 rounded-full border border-gray-400 checked:border-gray-600 focus:outline-none transition-all duration-200"
              />
              {serviceType === "warranty" && (
                <div className="absolute w-2.5 h-2.5 bg-gray-900 rounded-full pointer-events-none animate-in zoom-in-50 duration-200"></div>
              )}
            </div>
            <div>
              <Label htmlFor="warranty" className="text-gray-900 font-medium text-base cursor-pointer">
                {t("Serwis gwarancyjny", "Warranty service")}
              </Label>
              <p className="text-gray-600 text-sm mt-1">
                {t("Dla urządzeń objętych aktywną gwarancją producenta.", "For devices covered by an active manufacturer's warranty.")}
              </p>
            </div>
          </div>

          <div
            className={`flex items-start gap-3 transition-all duration-300 ease-in-out hover:bg-gray-100 rounded-md p-2 -m-2 cursor-pointer ${serviceType === "post-warranty" ? "bg-gray-100" : ""}`}
            onClick={() => handleServiceTypeChange("post-warranty")}
          >
            <div className="mt-1 relative flex items-center justify-center">
              <input
                type="radio"
                id="post-warranty"
                name="serviceType"
                value="post-warranty"
                checked={serviceType === "post-warranty"}
                onChange={() => {}}
                className="appearance-none w-5 h-5 rounded-full border border-gray-400 checked:border-gray-600 focus:outline-none transition-all duration-200"
              />
              {serviceType === "post-warranty" && (
                <div className="absolute w-2.5 h-2.5 bg-gray-900 rounded-full pointer-events-none animate-in zoom-in-50 duration-200"></div>
              )}
            </div>
            <div>
              <Label htmlFor="post-warranty" className="text-gray-900 font-medium text-base cursor-pointer">
                {t("Serwis pogwarancyjny", "Post-warranty service")}
              </Label>
              <p className="text-gray-600 text-sm mt-1">
                {t("Jeśli gwarancja już wygasła lub nie masz pewności", "If the warranty has expired or you are not sure")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-4 text-left pl-0">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex items-center text-gray-900 hover:text-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-50 rounded-sm">
              <span className="text-sm">{t("Sprawdź czy Twoje urządzenie jest na gwarancji", "Check if your device is under warranty")}</span>
              <div
                className={`ml-2 w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center transition-transform duration-300 ease-in-out ${isOpen ? "rotate-180" : "rotate-0"}`}
              >
                <ChevronDown className="h-3 w-3 text-white" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
              <div className="mt-4 text-gray-700 text-sm space-y-4">
                <div>
                  <h4 className="text-gray-900 font-semibold mb-3">
                    {t("Twoje urządzenie może być objęte gwarancją, jeśli:", "Your device may be covered by warranty if:")}
                  </h4>
                  <ol className="list-decimal list-inside space-y-3 ml-2">
                    <li>
                      {t("Od daty zakupu nie minęły ", "Less than ")}<strong className="text-gray-900 font-semibold">2 {t("lata", "years")}</strong>.
                    </li>
                    <li>
                      {t("W Twoim kraju wymagany ", "In your country, the required ")}<strong className="text-gray-900 font-semibold">{t("przegląd", "maintenance")}</strong>{" "}
                      {t("został wykonany zgodnie z instrukcją.", "was performed according to the instructions.")}
                    </li>
                  </ol>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">!</span>
                    </div>
                    <div>
                      <p className="text-red-700 font-semibold mb-1">{t("UWAGA!", "NOTICE!")}</p>
                      <p className="text-red-600 font-normal">
                        {t("Warunki przeglądu różnią się w zależności od kraju.", "Maintenance requirements vary depending on the country.")}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-start gap-2 mb-3">
                    <span className="text-gray-600">🔗</span>
                    <p className="text-gray-700 font-normal">
                      {t("Aby sprawdzić szczegóły dotyczące przeglądu, skorzystaj z dokumentacji:", "To check maintenance details, use the documentation:")}
                    </p>
                  </div>
                  <ul className="list-disc list-inside space-y-2 ml-6 text-gray-700 font-normal">
                    <li>
                      {t("Pendrive dołączony do urządzenia → plik", "USB drive included with the device → file")}{" "}
                      <strong className="text-gray-900 font-semibold">"{t("Warunki gwarancji", "Warranty terms")}"</strong> {t("lub", "or")}
                    </li>
                    <li>
                      {t("Pendrive dołączony do urządzenia → plik", "USB drive included with the device → file")}{" "}
                      <strong className="text-gray-900 font-semibold">"{t("Instrukcja użytkownika", "User manual")}"</strong> {t("lub", "or")}
                    </li>
                    <li>
                      {t("Zakładka", "The")} <strong className="text-gray-900 font-semibold">"Info"</strong> {t("w menu autoklawu.", "tab in the autoclave menu.")}
                    </li>
                  </ul>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {serviceType && (
        <div className="flex justify-center mt-6">
          <div className="text-gray-900 text-sm flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            {t("Przechodzimy dalej...", "Moving forward...")}
          </div>
        </div>
      )}
    </>
  )
}
