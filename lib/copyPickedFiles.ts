import { toast } from "sonner";

const UNREADABLE_FILE_MESSAGE =
  "Couldn't read the selected file. Please choose it again.";

// Android's photo picker can make picked files unreadable moments after
// selection, so copy them into memory before anything else reads them.
export async function copyPickedFiles(fileList: FileList | null) {
  const files = Array.from(fileList ?? []);
  const results = await Promise.allSettled(
    files.map(
      async (file) =>
        new File([await file.arrayBuffer()], file.name, {
          type: file.type,
          lastModified: file.lastModified,
        }),
    ),
  );
  const copies = results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );

  if (copies.length < files.length) toast.error(UNREADABLE_FILE_MESSAGE);
  return copies;
}
