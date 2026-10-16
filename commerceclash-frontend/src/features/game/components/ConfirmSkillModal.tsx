import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import { END_POINTS, post } from "@/api";
import { toast } from "sonner";
import { useUserContext } from "@/context";

interface StudentXpModalProps {
    open: boolean;
    setOpen: (value: boolean) => void;
}

const ConfirmSkillModal: React.FC<StudentXpModalProps> = ({ open, setOpen }) => {
    const location = useLocation();
    const searchParams = new URLSearchParams(window.location.search);
    const meetingId = searchParams.get("meetingId");
    const courseId = location.state?.courseId || 
        (meetingId ? localStorage.getItem(`meeting_${meetingId}_courseId`) : null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { id } = useUserContext();




    const handleSubmit = async () => {
        try {
            const endpoint = END_POINTS.CONFIRM_SKILLS.replace(
                "{cid}",
                courseId
            ).replace(
                "{sid}",
                id
            );
            await post(endpoint);
            // toast.success("Market Share submitted successfully");
            setOpen(false);
        } catch (error) {
            toast.error((error as Error).message);
        } finally {
            setOpen(false);
            setIsSubmitting(false);
        }
    };


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
                {/* Student Input Rows */}
                <div className="space-y-4 py-4">
                    <h1> You Sure! You want to confirm with the available Points?</h1>
                </div>
                {/* Submit Button */}
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button disabled={isSubmitting} onClick={handleSubmit}>
                        Confirm
                    </Button>
                </div>
            </DialogContent>


        </Dialog>
    );
};

export default ConfirmSkillModal;
