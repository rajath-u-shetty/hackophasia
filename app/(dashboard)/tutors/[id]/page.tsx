"use client";
import { useQuery } from "react-query";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useChat } from "ai/react";
import { ChatList } from "@/components/tutors/ChatList";
import { ChatForm } from "@/components/tutors/ChatForm";
import { TutorSettings } from "@/components/tutors/TutorSettings";
import { ChatScrollAnchor } from "@/components/tutors/ChatScrollAnchor";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ExtendedTutor } from "@/types/prisma";
import PdfRenderer from "@/components/PdfRenderer";
import { useState } from "react";

export default function TutorPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isScrollStable, setIsScrollStable] = useState(true);

  const {
    messages,
    input,
    handleInputChange,
    setMessages,
    append,
    setInput,
    isLoading: isChatLoading,
  } = useChat({
    api: `/api/tutors/${params.id}/chat`,
    onError: (error) => {
      toast({
        title: "Uh oh something went wrong!",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: tutor, isLoading } = useQuery({
    queryKey: ["tutors", { id: params.id }],
    queryFn: async (): Promise<ExtendedTutor> => {
      const res = await fetch(`/api/tutors/${params.id}`);
      if (!res.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await res.json();
      return data;
    },
    onSuccess: (data) => {
      if (data.messages.length) {
        const initMessages = data.messages.map((message) => ({
          id: message.id,
          role: message.role as "assistant" | "system" | "user" | "function",
          content: message.content,
        }));
        setMessages(initMessages);
      }
    },
    onError: (data) => {
      toast({
        title: "Uh oh, something went wrong!",
        description: <p>There was an error loading the AI tutor.</p>,
        variant: "destructive",
        action: (
          <ToastAction altText="Try again" onClick={() => router.refresh()}>
            Try again
          </ToastAction>
        ),
      });
    },
  });

  return (
    <div className="flex gap-4 py-10 px-8 items-start justify-between h-screen overflow-hidden">
      <div className="w-2/5 h-full overflow-auto border border-gray-300 rounded-md p-10">
        <PdfRenderer url={tutor?.url ?? ""} />
      </div>
      <div className="flex flex-col flex-1 max-w-4xl mx-auto w-full pt-10 md:pt-16 px-4 gap-10 h-full overflow-auto border border-gray-300 rounded-md p-10">
        {isLoading ? (
          <div className="flex w-full justify-center py-8">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          tutor && (
            <>
              <div className="flex flex-col gap-6">
                <div className="w-full gap-4 flex justify-between items-center">
                  <div className="flex flex-col w-full">
                    <h3 className="font-bold text-2xl">{tutor?.title}</h3>
                    <p className="font-medium text-muted-foreground">
                      {tutor?.description}
                    </p>
                  </div>
                  <TutorSettings tutor={tutor} />
                </div>
              </div>
              <div className="pb-[200px]">
                <ChatList messages={messages} />
                <ChatScrollAnchor
                  trackVisibility={isChatLoading}
                  messages={messages}
                />
              </div>
            </>
          )
        )}
        <ChatForm
          isLoading={isChatLoading}
          input={input}
          handleInputChange={handleInputChange}
          append={append}
          setInput={setInput}
        />
      </div>
    </div>
  );
}
