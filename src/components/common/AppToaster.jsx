import { Toaster } from "sileo";

export default function AppToaster() {
  return (
    <Toaster
      position="top-center"
      theme="dark"
      options={{
        title: "Saved",
        fill: "#171717",
        roundness: 16,
        styles: {
          title: "text-white!",
          description: "text-white/75!",
          badge: "bg-white/10!",
          button: "bg-white/10! hover:bg-white/15!",
        },
      }}
    />
  );
}
