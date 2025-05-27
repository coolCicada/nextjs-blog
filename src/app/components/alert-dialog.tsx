"use client";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from '@/components/ui/alert-dialog'; // Adjust path for shadcn/ui
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';

// Interface for dialog props
interface AlertDialogProps {
    title: string;
    content: string;
    isOpen: boolean;
    onResolve: () => void;
    onReject: () => void;
}

// Reusable AlertDialog component
const AlertDialogWrapper = ({ title, content, isOpen, onResolve, onReject }: AlertDialogProps) => {
    if (!isOpen) return null;
    return (
        <AlertDialog open={isOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{content}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onReject}>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={onResolve}>确认</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

// Utility function to show dialog and return a Promise
export const showAlertDialog = ({ title, content }: { title: string; content: string }) => {
    return new Promise((resolve, reject) => {
        // Create a container div for the dialog
        const container = document.createElement('div');
        document.body.appendChild(container);

        // Create a root for rendering
        const root = createRoot(container);

        // Render the dialog using a portal
        const render = () => {
            root.render(
                createPortal(
                    <AlertDialogWrapper
                        title={title}
                        content={content}
                        isOpen={true}
                        onResolve={() => {
                            resolve(true);
                            root.unmount();
                            container.remove();
                        }}
                        onReject={() => {
                            reject(new Error('Dialog cancelled'));
                            root.unmount();
                            container.remove();
                        }}
                    />,
                    container
                )
            );
        };

        render();
    });
};