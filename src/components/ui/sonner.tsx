import {Toaster as Sonner, type ToasterProps} from "sonner";

function Toaster(props: ToasterProps) {
    return (
        <Sonner
            theme="dark"
            position="bottom-center"
            offset={20}
            toastOptions={{
                classNames: {
                    toast: "!rounded-2xl !border !border-glass-border !bg-surface !text-foreground !shadow-2xl !text-sm !backdrop-blur-xl",
                    description: "!text-muted-foreground",
                },
            }}
            {...props}
        />
    );
}

export {Toaster};
