export const getProductImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) return "";
  
  if (
    imagePath.startsWith("http://") || 
    imagePath.startsWith("https://") || 
    imagePath.startsWith("data:")
  ) {
    return imagePath;
  }
  
  if (imagePath.startsWith("/BuggyDm/")) {
    return imagePath;
  }

  if (imagePath.startsWith("/uploads/")) {
    return `/BuggyDm${imagePath}`;
  }

  if (imagePath.startsWith("/storage/")) {
    return `/BuggyDm${imagePath}`;
  }
  
  const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;

  if (cleanPath.startsWith("storage/")) {
    return `/BuggyDm/${cleanPath}`;
  }

  if (cleanPath.startsWith("product/")) {
    return `/BuggyDm/storage/${cleanPath}`;
  }

  const rawBase = process.env.NEXT_PUBLIC_IMAGE_BASE_URL?.trim();

  if (!rawBase || rawBase.includes("localhost:8888") || rawBase.includes("BuggyMD")) {
    return `/BuggyDm/storage/product/${cleanPath}`;
  }

  const sanitizedBase = rawBase.replace(/\/$/, "");
  if (sanitizedBase.endsWith("/product")) {
    return `${sanitizedBase}/${cleanPath}`;
  }

  return `${sanitizedBase}/${cleanPath}`;
};

export const getDeliveryBoyImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) return "";

  if (
    imagePath.startsWith("http://") || 
    imagePath.startsWith("https://") || 
    imagePath.startsWith("data:")
  ) {
    return imagePath;
  }

  if (imagePath.startsWith("/BuggyDm/")) {
    return imagePath;
  }

  if (imagePath.startsWith("/uploads/")) {
    return `/BuggyDm${imagePath}`;
  }

  if (imagePath.startsWith("/storage/")) {
    return `/BuggyDm${imagePath}`;
  }

  const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;

  if (cleanPath.startsWith("storage/")) {
    return `/BuggyDm/${cleanPath}`;
  }

  if (cleanPath.startsWith("delivery-man/")) {
    return `/BuggyDm/storage/${cleanPath}`;
  }

  return `/BuggyDm/storage/delivery-man/${cleanPath}`;
};
