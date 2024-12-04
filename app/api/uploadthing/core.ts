import { createUploadthing, type FileRouter } from "uploadthing/next";

import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { pinecone } from "@/lib/pinecone";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/prisma/client";

const f = createUploadthing();

const middleware = async () => {
  const session = await getAuthSession();
    const user = session?.user;

  if (!user || !user.id) throw new Error("Unauthorized");

  return { userId: user.id };

};

const onUploadComplete = async ({
  metadata,
  file,
}: {
  metadata: Awaited<ReturnType<typeof middleware>>;
  file: {
    key: string;
    name: string;
    url: string;
  };
}) => {
  const isFileExist = await prisma.tutor.findFirst({
    where: {
      key: file.key,
    },
  });

  if (isFileExist) return;

  try {
    const createdFile = await prisma.tutor.create({
      data: {
        key: `${file.name}+${file.url}`,
        name: file.name,
        userId: metadata.userId,
        url: file.url,
        uploadStatus: "PROCESSING",
      },
    });

    if (createdFile) {
      await prisma.generation.create({
        data: {
          userId: metadata.userId,
          type: "tutor",
        },
      });
    }
    console.log(createdFile)
    console.log("File Uploaded")

    try {
      const response = await fetch(
        file.url
      );

      const blob = await response.blob();

      const loader = new PDFLoader(blob);

      const pageLevelDocs = await loader.load();
      console.log(pageLevelDocs);

      const pagesAmt = pageLevelDocs.length;

      // vectorize and index entire document
      const pineconeIndex = pinecone.Index("byte-busters");
      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
      });

      await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
        pineconeIndex,
      });

      await prisma.tutor.update({
        data: {
          uploadStatus: "SUCCESS",
        },
        where: {
          id: createdFile.id,
        },
      });
    } catch (err) {
      console.log(err);
      await prisma.tutor.update({
        data: {
          uploadStatus: "FAILED",
        },
        where: {
          id: createdFile.id,
        },
      });
    }
  } catch (error: any) {
    console.log(error)
  };
};

export const ourFileRouter = {
  freePlanUploader: f({ pdf: { maxFileSize: "16MB" } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
  documentUpload: f({
    pdf: { maxFileSize: "16MB" },
    text: { maxFileSize: "16MB" },
    blob: { maxFileSize: "16MB" },
  })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
  imageUpload: f({
    image: { maxFileSize: "16MB" },
  })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

