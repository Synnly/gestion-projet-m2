import { Navbar } from '../navbar/Navbar';
import { CircleQuestionMark } from 'lucide-react';

export const NotFound = () => {
    return (
        <div className="flex flex-col h-screen">
            <Navbar />
            <div className="flex flex-1 flex-col w-full justify-center overflow-hidden items-center gap-8">
                <div className="absolute flex justify-center items-center opacity-5">
                    <CircleQuestionMark size={700} />
                </div>
                <div className="flex items-center font-bold text-8xl gap-8">404</div>
                <div className="text-center">
                    <div>
                        Mmmmmmh ... on a les meilleurs experts sur le coup mais on ne trouve pas ce que vous cherchez
                        ...
                    </div>
                    <div>Vérifiez que l'URL est correcte ou essayez de revenir à la page d'accueil.</div>
                </div>
            </div>
        </div>
    );
};
