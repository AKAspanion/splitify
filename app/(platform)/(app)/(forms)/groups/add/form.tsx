"use client";

import { createGroup } from "@/actions/create-group";
import { FormInput } from "@/components/form/form-input";
import { FormSubmit } from "@/components/form/form-submit";
import { uploadFiles } from "@/components/uploadthing/uploadthing";
import { useAction } from "@/hooks/use-action";
import { randomNumber } from "@/utils/func";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export const Form = () => {
  const router = useRouter();
  // const [state, setLoading] = useState(false);
  const { execute, fieldErrors } = useAction(createGroup, {
    onSuccess: (data) => {
      router.push(`/groups/${data.id}`);
      toast.success("Group created successfully");
    },
    onError: (error, debug) => {
      console.error(debug);
      toast.error(error);
    },
  });

  const onSubmit = async (formData: FormData) => {
    const title = formData.get("title") as string;
    const type = formData.get("type") as string;
    // const imgFile = formData.get("image") as File;

    const imageId = randomNumber(1, 20);
    let image_url = `/images/placeholder/groups/${imageId}.png`;
    // if (imgFile) {
    //   try {
    //     setLoading(true);
    //     const images = await uploadFiles("imageUploader", {
    //       files: [imgFile],
    //     });
    //     console.log(images);
    //     image_url = images?.[0]?.url || image_url;
    //     setLoading(false);
    //   } catch (error) {setLoading(false);}
    // }

    execute({ title, type, image_url });
  };

  return (
    <form className="flex flex-col gap-6" action={onSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <FormInput
          label="Image"
          id="image"
          name="image"
          type="file"
          accept="image/png, image/gif, image/jpeg"
        />
        <FormInput
          label="Group name"
          id="title"
          name="title"
          errors={fieldErrors?.title}
        />
        <FormInput
          id="type"
          name="type"
          label="Type"
          errors={fieldErrors?.type}
        />
      </div>
      <FormSubmit>Create</FormSubmit>
    </form>
  );
};
