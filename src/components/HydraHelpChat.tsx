import { useState } from "react";
import { Bot, MessageCircle, Send, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ChatRole = "assistant" | "user";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

type HydraHelpApiResponse = {
  reply?: string;
  error?: string;
};

const initialAssistantMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text:
    "Hi, I’m HydraHelp. Ask me about waterborne diseases or how to use the Arogya Jal platform.",
};



const hydraHelpApiUrl = import.meta.env.VITE_HYDRAHELP_API_URL as string | undefined;

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function looksLikeSymptomsOnly(query: string) {
  const text = normalize(query);
  return hasAny(text, ["diarrhea", "diarrhoea", "vomiting", "fever", "stomach", "abdominal", "dehydration", "nausea", "weakness", "jaundice", "rash"]);
}

function buildPossibleDiseasesAnswer(query: string) {
  const text = normalize(query);
  const matches = [] as string[];

  if (hasAny(text, ["diarrhea", "diarrhoea", "vomiting", "dehydration"])) {
    matches.push("cholera", "acute gastroenteritis");
  }

  if (hasAny(text, ["fever", "stomach", "abdominal", "weakness"])) {
    matches.push("typhoid", "gastroenteritis");
  }

  if (hasAny(text, ["jaundice", "yellow", "liver"])) {
    matches.push("hepatitis A/E");
  }

  if (hasAny(text, ["stomach pain", "abdominal pain", "cramps", "bloody", "mucus"])) {
    matches.push("dysentery", "amoebiasis");
  }

  if (hasAny(text, ["bloating", "nausea", "greasy", "smelly", "gas"])) {
    matches.push("giardiasis");
  }

  const uniqueMatches = [...new Set(matches)];

  if (uniqueMatches.length === 0) {
    return null;
  }

  return [
    `Based on the symptoms you mentioned, possible waterborne diseases could include ${uniqueMatches.join(", ")}.`,
    "This is not a diagnosis, but it can help you understand what to ask a clinician about.",
    "If there is blood in stool, repeated vomiting, high fever, confusion, or severe dehydration, seek urgent medical care.",
  ].join(" ");
}

function buildDiseaseAnswer(query: string) {
  const text = normalize(query);
  const severeWarning =
    "Seek urgent medical care if there is blood in stool, repeated vomiting, severe dehydration, confusion, high fever, breathing trouble, or extreme weakness.";

  const possibleDiseases = buildPossibleDiseasesAnswer(query);
  if (possibleDiseases && looksLikeSymptomsOnly(text)) {
    return possibleDiseases;
  }

  if (hasAny(text, ["cause", "causes", "why", "spread", "contaminate", "contaminated", "infection"])) {
    return [
      "Waterborne diseases usually spread through contaminated drinking water, unsafe food, poor sanitation, or hand hygiene gaps.",
      "Common causes include bacteria, viruses, and parasites from sewage, floodwater, or dirty storage containers.",
      severeWarning,
    ].join(" ");
  }

  if (hasAny(text, ["symptom", "symptoms", "sign", "diarrhea", "diarrhoea", "vomiting", "fever", "stomach", "abdominal", "dehydration", "jaundice", "rash"])) {
    return [
      "Common symptoms include loose stools, vomiting, stomach pain, fever, weakness, dehydration, nausea, and sometimes jaundice or skin changes depending on the illness.",
      "If symptoms are worsening, lasting more than a day or two, or affecting children, elderly people, or pregnant women, get medical help sooner.",
      severeWarning,
    ].join(" ");
  }

  if (hasAny(text, ["severity", "serious", "danger", "emergency", "critical", "bad", "worse"])) {
    return [
      "Severity depends on hydration loss, fever, age, and how quickly symptoms appear.",
      "Mild cases may improve with rest and fluids, but severe dehydration can become dangerous quickly.",
      severeWarning,
    ].join(" ");
  }

  if (hasAny(text, ["precaution", "prevent", "prevention", "avoid", "stop", "safe", "clean water", "hygiene"])) {
    return [
      "Use boiled or filtered water, wash hands before eating and after using the toilet, keep food covered, and store water in clean containers.",
      "Avoid street food or unsafe water during outbreaks, and clean tanks, taps, and containers regularly.",
      "If your area has contamination, follow local health advisories and report unusual symptoms quickly.",
    ].join(" ");
  }

  if (hasAny(text, ["recover", "recovery", "heal", "treatment", "what to do", "care", "medicine"])) {
    return [
      "For mild illness, rest and keep sipping safe fluids or oral rehydration solution to avoid dehydration.",
      "Eat light, simple meals if tolerated, and avoid alcohol or very oily food while recovering.",
      "If vomiting is frequent, dehydration appears, or symptoms are severe, see a clinician right away.",
      severeWarning,
    ].join(" ");
  }

  if (hasAny(text, ["cholera", "typhoid", "hepatitis", "dysentery", "giardia", "amoebic", "leptospirosis"])) {
    return [
      "I can explain the disease you named, including symptoms, likely causes, prevention, severity, and recovery guidance.",
      "If you want, I can also compare it with similar waterborne diseases.",
    ].join(" ");
  }

  return [
    "I can help with waterborne diseases, symptoms, precautions, recovery, and Arogya Jal usage.",
    "Try asking: 'Which diseases could these symptoms indicate?' or 'How do I use Arogya Jal?'",
  ].join(" ");
}

function buildArogyaJalAnswer(query: string) {
  const text = normalize(query);

  if (hasAny(text, ["public", "public dashboard", "public user", "reports", "municipality"])) {
    return [
      "As a public user, the dashboard shows reports for your registered municipality, total reports, people surveyed, and common symptoms.",
      "HydraHelp is there to explain health terms and how to use the app.",
    ].join(" ");
  }

  if (hasAny(text, ["asha", "worker", "survey", "profile", "submit"])) {
    return [
      "ASHA workers use the survey form to enter booth, ward, municipality, symptoms, age groups, and water quality data.",
      "Their dashboard shows personal survey history and profile details.",
    ].join(" ");
  }

  if (hasAny(text, ["government", "gov", "official", "analytics", "report", "dashboard"])) {
    return [
      "Government officials can view all survey submissions, trends, symptom summaries, water quality charts, and detailed survey records.",
      "They can open each submission to inspect the full survey and generate a report from that view.",
    ].join(" ");
  }

  return [
    "Arogya Jal is a health monitoring platform for ASHA workers, public users, and government officials.",
    "It helps collect surveys, track symptoms and water quality, and surface early health warnings.",
    "If you want, ask me about public dashboard usage, ASHA survey flow, or government analytics.",
  ].join(" ");
}

function buildWaterQualityAnswer(query: string) {
  return [
    "pH: pH measures how acidic or alkaline water is on a 0–14 scale. Safe drinking water typically falls between about 6.5 and 8.5.",
    "Extremely low or high pH can cause taste issues, corrosion of pipes, skin or eye irritation, and it changes how well disinfectants like chlorine work (chlorine is less effective at high pH).",
    "Turbidity: turbidity measures suspended particles (silt, organic matter, and microbes) in water and is reported in NTU. High turbidity often indicates possible contamination and can shelter pathogens from disinfection, making treatment less effective.",
    "The World Health Organization recommends very low turbidity (near 1 NTU or lower) for effective disinfection; when turbidity is high, pre-filtration, settling, or boiling is advised before chlorination.",
    "Temperature: warmer water accelerates growth and survival of many bacteria and some parasites and can encourage algal blooms. Cooler water generally slows microbial growth but can preserve some viruses longer.",
    "How these affect disease risk: high turbidity, warm temperatures, and pH values that reduce disinfectant effectiveness combine to increase the chance that pathogens survive treatment and reach people, raising outbreak risk for waterborne diseases such as cholera, typhoid, and giardiasis.",
    "Practical steps: monitor pH, turbidity, and temperature; remove turbidity with settling/filtration before disinfecting; adjust chlorine dosing when pH is high; boil water or use certified filters when in doubt; store treated water in clean, covered containers.",
  ].join(" \n\n");
}

function generateFallbackReply(query: string) {
  const text = normalize(query);

  if (hasAny(text, ["arogya jal", "dashboard", "public user", "asha", "government", "government official", "how do i use", "how to use", "feature", "functionality"])) {
    return buildArogyaJalAnswer(query);
  }

  if (hasAny(text, ["ph", "ph", "turbidity", "ntu", "temperature", "temp", "water quality", "turbid"])) {
    return buildWaterQualityAnswer(query);
  }

  return buildDiseaseAnswer(query);
}

function isGreeting(text: string) {
  return hasAny(normalize(text), ["hi", "hello", "hey", "namaste"]);
}

export default function HydraHelpChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([initialAssistantMessage]);
  const [isSending, setIsSending] = useState(false);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      text: trimmed,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      if (hydraHelpApiUrl) {
        const response = await fetch(hydraHelpApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages: nextMessages }),
        });

        const data = (await response.json()) as HydraHelpApiResponse;

        if (!response.ok) {
          throw new Error(data.error || "AI server request failed.");
        }

        setMessages((current) => [
          ...current,
          {
            id: `${Date.now()}-assistant`,
            role: "assistant",
            text: data.reply?.trim() || generateFallbackReply(trimmed),
          },
        ]);
        return;
      }

      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          text: isGreeting(trimmed)
            ? "Hello! Ask me about waterborne diseases or how to use Arogya Jal, and I’ll guide you step by step."
            : generateFallbackReply(trimmed),
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          text: `${generateFallbackReply(trimmed)} (AI server unavailable, so I used the built-in guide.)`,
        },
      ]);
      console.error("HydraHelp chat error:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 rounded-full px-5 shadow-lg"
      >
        <MessageCircle className="mr-2 h-5 w-5" />
        HydraHelp
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-[90vh] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:h-[80vh]">
          <DialogHeader className="border-b px-6 py-5 flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="h-5 w-5 text-primary" />
                HydraHelp
              </DialogTitle>
              <DialogDescription>
                Ask about waterborne diseases or how to use the Arogya Jal platform.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMessages([initialAssistantMessage]);
                  setInput("");
                  setIsSending(false);
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                New chat
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden p-4">
            <Card className="flex h-full flex-col overflow-hidden border-0 shadow-none">
              <CardContent className="flex h-full flex-col gap-4 p-0">
                <ScrollArea className="flex-1 rounded-lg border bg-background p-4 overflow-auto">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.role === "user" ? "justify-end" : "justify-start",
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6",
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground",
                          )}
                        >
                          {message.role === "assistant" && (
                            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                              <Bot className="h-4 w-4" />
                              HydraHelp
                            </div>
                          )}
                          {message.text}
                        </div>
                      </div>
                    ))}
                    {isSending && (
                      <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-3 text-sm leading-6 text-foreground">
                          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                            <Bot className="h-4 w-4" />
                            HydraHelp
                          </div>
                          Thinking...
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="space-y-3 rounded-lg border bg-card p-3">
                  <Textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Ask HydraHelp about disease symptoms, precautions, recovery, or Arogya Jal..."
                    rows={2}
                    className="min-h-[48px] resize-none"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void sendMessage(input);
                      }
                    }}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Press Enter to send. Shift+Enter for a new line.
                    </p>
                    <Button onClick={() => void sendMessage(input)} disabled={!input.trim() || isSending}>
                      <Send className="mr-2 h-4 w-4" />
                      {isSending ? "Sending..." : "Send"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}