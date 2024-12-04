"use client";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { ArrowRight, Cloud, File, Loader2, Swords } from "lucide-react";
import { useState } from "react";
import Dropzone from "react-dropzone";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, buttonVariants } from "./ui/button";
import { Progress } from "./ui/progress";
import { useToast } from "./ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

const UploadDropzone = () => {
  const { toast } = useToast();

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [uplodedDocument, setUploadedDocument] = useState<any>();
  const [finishUploading, setFinishUploading] = useState<boolean>(false);

  const FormSchema = z.object({
    language: z.string({
      required_error: "Please select a Language",
    }),
  });

  const formSchema = z.object({
    language: z.string(),
  });

  const form1 = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmitForm1 = async (data: z.infer<typeof FormSchema>) => {
    setFinishUploading(true)
    const options = {
      method: "POST",
      url: "https://api.edenai.run/v2/translation/document_translation",
      headers: {
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiODg1NjhmYTktM2ZlNy00MGU1LTg1ZDctYmVlNGVmODcyZjFhIiwidHlwZSI6ImFwaV90b2tlbiJ9.EWzT_bUTkMXIgqgcxzFKIw_Cl1n3gv5oejkLYnY4ONw",
      },
      data: {
        providers: "google",
        source_language: "en",
        target_language: data.language ? data.language : "hi",
        file_url: uplodedDocument,
        fallback_providers: "",
      },
    };
    axios
      .request(options)
      .then((response) => {
        setFileUrl(response.data.google.document_resource_url);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const { startUpload } = useUploadThing("documentUpload");

  const startSimulatedProgress = () => {
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prevProgress) => {
        if (prevProgress >= 95) {
          clearInterval(interval);
          return prevProgress;
        }
        return prevProgress + 5;
      });
    }, 500);

    return interval;
  };

  if (fileUrl)
    return (
      <div className="flex flex-col items-center justify-evenly gap-12 py-24 px-6">
        <h1 className="text-xl font-semibold">
          Document translated successfully
        </h1>
        <a
          href={fileUrl}
          target="_blank"
          className={cn(buttonVariants({ variant: "language" }), "w-full")}
        >
          Download Now
        </a>
      </div>
    );

  return (
    <Dropzone
      multiple={false}
      onDrop={async (acceptedFile) => {
        setIsUploading(true);

        const progressInterval = startSimulatedProgress();

        // handle file uploading
        const res = await startUpload(acceptedFile);
        console.log(acceptedFile[0].type);
        console.log(typeof acceptedFile[0].type);

        console.log({ res });

        if (!res) {
          return toast({
            title: "Something went wrong",
            description: "Please try again later",
            variant: "destructive",
          });
        }

        const [fileResponse] = res;

        const key = fileResponse?.key;

        if (!key) {
          return toast({
            title: "Something went wrong",
            description: "Please try again later",
            variant: "destructive",
          });
        }

        clearInterval(progressInterval);
        setUploadProgress(100);
        setUploadedDocument(fileResponse.url);
      }}
    >
      {({ getRootProps, getInputProps, acceptedFiles }) => (
        <div>
          <div
            {...getRootProps()}
            className="h-64 m-4 border-dashed border-gray-300 border-2 rounded-lg"
          >
            <div className="flex items-center justify-center h-full w-full">
              <label
                htmlFor="dropzone-file"
                className="flex flex-col items-center justify-center w-full h-full rounded-lg cursor-pointer bg-gray-50 dark:bg-[rgb(23,23,23)] hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Cloud className="h-6 w-6 text-zinc-500 mb-2 dark:text-white" />
                  <p className="mb-2 text-sm text-zinc-700 dark:text-white">
                    <span className="font-semibold dark:text-white">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-white">PDF (up to 4 MB)</p>
                </div>

                {acceptedFiles && acceptedFiles[0] ? (
                  <div className="max-w-xs bg-white flex items-center rounded-md overflow-hidden outline outline-[1px] outline-zinc-200 divide-x divide-zinc-200">
                    <div className="px-3 py-2 h-full grid place-items-center">
                      <File className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="px-3 py-2 h-full text-sm truncate text-black">
                      {acceptedFiles[0].name}
                    </div>
                  </div>
                ) : null}

                {isUploading ? (
                  <div className="w-full mt-4 max-w-xs mx-auto">
                    <Progress
                      indicatorColor={
                        uploadProgress === 100 ? "bg-green-500" : ""
                      }
                      value={uploadProgress}
                      className="h-1 w-full bg-zinc-200"
                    />
                    {uploadProgress === 100 && !finishUploading ? (
                      <div className="flex gap-1 items-center justify-center text-sm text-zinc-700 dark:text-white text-center pt-2">
                        Select language
                      </div>
                    ) : null}
                    {finishUploading ? (
                      <div className="flex gap-1 items-center justify-center text-sm text-zinc-700 text-center pt-2">
                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin dark:text-white" />
                        Translating...
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <input
                  {...getInputProps()}
                  type="file"
                  id="dropzone-file"
                  className="hidden"
                />
              </label>
            </div>
          </div>
          <div className="flex space-x-2 mx-4">
            <Form {...form1}>
              <form
                onSubmit={form.handleSubmit(onSubmitForm1)}
                className="space-y-6 flex-1"
                id="file-input"
              >
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className={cn(" min-w-48 md:min-w-[180px]", { "focus-visible:ring-red-500": form.formState.errors.language })}>
                            <SelectValue placeholder="Select Language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hi">Hindi</SelectItem>
                          <SelectItem value="mr">Marathi</SelectItem>
                          <SelectItem value="bn">Bengali</SelectItem>
                          <SelectItem value="gu">Gujarati</SelectItem>
                          <SelectItem value="ta">Tamil</SelectItem>
                          <SelectItem value="te">Telugu</SelectItem>
                          <SelectItem value="pa">Punjabi</SelectItem>
                          <SelectItem value="sd">Sindhi</SelectItem>
                          <SelectItem value="ur">Urdu</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
            <Button variant="language" form="file-input" type="submit" disabled={!uplodedDocument}>
              Submit
            </Button>
          </div>
        </div>
      )}
    </Dropzone>
  );
};

const LanguageFileUpload = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) {
          setIsOpen(v);
        }
      }}
    >
      <DialogTrigger asChild onClick={() => setIsOpen(true)}>
        <div
          className="hover:opacity-70 duration-500"
        >
          <Card className="flex justify-between items-center h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Swords className="h-4 w-4 mr-2" />
                Translate Document
              </CardTitle>
              <CardDescription>Upload a document to translate</CardDescription>
            </CardHeader>
            <CardContent>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <UploadDropzone />
      </DialogContent>
    </Dialog>
  );
};

export default LanguageFileUpload;

