import logo from "../assets/logroprimario2.png";

// El PNG del logo (500×500) trae mucho espacio en blanco: se recorta con CSS
// a la zona del trazo (x 128–392, y 138–368). Igual que en la landing.
const Logo = ({ className = "w-24" }: { className?: string }) => (
  <span className={`block overflow-hidden aspect-[264/230] ${className}`}>
    <img
      src={logo}
      alt="Nail's Art Suray"
      className="block max-w-none w-[189.4%] -ml-[48.5%] -mt-[52.3%]"
    />
  </span>
);

export default Logo;
