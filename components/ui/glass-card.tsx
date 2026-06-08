import * as React from "react";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  logo: React.ReactNode;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, title, description, logo, ...props }, ref) => {
    return (
      <div
        ref={ref}
  className={`group h-92.5 w-85 perspective:[1000px] ${className}`}
        {...props}
      >
        <div className="relative h-full rounded-[50px] bg-linear-to-br from-zinc-900 to-black shadow-2xl transition-all duration-500 ease-in-out transform group-hover:[box-shadow:rgba(0,0,0,0.3)_30px_50px_25px_-40px,rgba(0,0,0,0.1)_0px_25px_30px_0px] group-hover:transform-[rotate3d(1,1,0,30deg)]">
          <div className="absolute inset-2 rounded-[55px] border-b border-l border-white/20 bg-linear-to-b from-white/30 to-white/10 backdrop-blur-sm transform-[translate3d(0,0,25px)]"></div>
          <div className="absolute transform-[translate3d(0,0,26px)] w-full">
            <div className="px-7 pt-25 pb-0">
              <span className="block text-xl font-black text-white">
                {title}
              </span>
              <span className="mt-5 block text-[15px] text-zinc-300">
                {description}
              </span>
            </div>
          </div>
          {/* Remove social icons and view more */}
          <div className="absolute top-0 right-0 transform">
            {/* Circles animation */}
            {[
              { size: "170px", pos: "8px", z: "20px", delay: "0s" },
              { size: "140px", pos: "10px", z: "40px", delay: "0.4s" },
              { size: "110px", pos: "17px", z: "60px", delay: "0.8s" },
              { size: "80px", pos: "23px", z: "80px", delay: "1.2s" },
            ].map((circle, index) => (
              <div
                key={index}
                className="absolute aspect-square rounded-full bg-white/10 shadow-[rgba(100,100,111,0.2)_-10px_10px_20px_0px] transition-all duration-500 ease-in-out"
                style={{
                  width: circle.size,
                  top: circle.pos,
                  right: circle.pos,
                  transform: `translate3d(0, 0, ${circle.z})`,
                  transitionDelay: circle.delay,
                }}
              ></div>
            ))}
            <div
              className="absolute grid aspect-square w-12.5 place-content-center rounded-full bg-white shadow-[rgba(100,100,111,0.2)_-10px_10px_20px_0px] transition-all duration-500 ease-in-out transform-[translate3d(0,0,100px)] [transition-delay:1.6s] group-hover:transform-[translate3d(0,0,120px)]"
              style={{ top: "30px", right: "30px" }}
            >
              {logo}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export default GlassCard;