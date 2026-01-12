import { motion } from 'motion/react';
import InternshipCard from '../../../modules/internship/InternshipCard';
import type { Internship } from '../../../types/internship.types';

type Props = {
    internships: Internship[];
};

export default function InternshipGrid({ internships }: Props) {
    return (
        <div
            className="relative max-w-6xl mx-auto"
            style={{ perspective: '2000px', perspectiveOrigin: 'center center' }}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {internships.map((internship, index) => (
                    <motion.div
                        key={internship._id}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 * index }}
                    >
                            <InternshipCard internship={internship} isSelected={false} />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
