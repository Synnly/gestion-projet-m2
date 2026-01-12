import React from 'react';
import { motion } from 'motion/react';

type Props = {
    icon: React.ReactNode;
    title: string;
    description: string;
    index?: number;
};

export default function FeatureCard({ icon, title, description, index = 0 }: Props) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * index }}
        >
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow h-full">
                <div className="card-body">
                    <div className="text-primary mb-4">{icon}</div>
                    <h3 className="card-title">{title}</h3>
                    <p className="text-base-content/70">{description}</p>
                </div>
            </div>
        </motion.div>
    );
}
