import {Component, type ErrorInfo, type ReactNode} from "react";
import i18n from "@/i18n";
import {Button} from "@/components/ui/button";

type ErrorBoundaryProps = {children: ReactNode};
type ErrorBoundaryState = {hasError: boolean};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = {hasError: false};

    static getDerivedStateFromError(): ErrorBoundaryState {
        return {hasError: true};
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error("Unhandled UI error", error, info.componentStack);
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div role="alert" className="sky-clear-night flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
                <h1 className="font-display text-2xl font-semibold">{i18n.t("common:error")}</h1>
                <Button variant="brand" onClick={() => window.location.reload()}>{i18n.t("common:retry")}</Button>
            </div>
        );
    }
}
