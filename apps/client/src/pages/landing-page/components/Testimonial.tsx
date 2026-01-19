import { motion } from 'motion/react';

type Props = {
    name: string;
    role: string;
    text: string;
    rating?: number;
    delay?: number;
};

export default function Testimonial({ name, role, text, rating = 5, delay = 0 }: Props) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="card bg-base-100 shadow-xl"
        >
            <div className="card-body">
                <div className="flex items-center gap-2 mb-4">
                    <div className="rating rating-sm pointer-events-none">
                        {[...Array(Math.max(0, Math.min(5, rating)))].map((_, i) => (
                            <input key={i} type="radio" className="mask mask-star-2 bg-warning" checked readOnly />
                        ))}
                    </div>
                </div>

                <p className="text-base-content/70">{text}</p>

                <div className="mt-4">
                    <p className="font-bold">{name}</p>
                    <p className="text-sm text-base-content/60">{role}</p>
                </div>
            </div>
        </motion.div>
    );
}
